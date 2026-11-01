import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Quest, DungeonResult } from '../../domain/models/Quest';
import { DynamicItem } from '../../domain/models/DynamicItem';
import { QuestRepository } from '../../data/repositories/QuestRepository';
import { InventoryRepository } from '../../data/repositories/InventoryRepository';
import { ApiDataSource } from '../../data/datasources/ApiDataSource';
import { ApiDynamicItem } from '../../data/datasources/ApiTypes';
import { usePlayerStore } from './usePlayerStore';
import { isOnline } from '../../core/network';
import { Rarity } from '../../core/constants';
import { RewardService, rollRewardRarity } from '../../data/services/RewardService';
import { DungeonService } from '../../data/services/DungeonService';
import { DailyTimelineService } from '../../data/services/DailyTimelineService';
import { NotificationService } from '../../core/NotificationService';
import { todayDateStr } from '../../core/dateUtils';

const questRepo = new QuestRepository();
const inventoryRepo = new InventoryRepository();

function apiItemToDomain(item: ApiDynamicItem): DynamicItem {
  return {
    id: item.item_id ?? item.id ?? uuidv4(),
    type: (item.type as DynamicItem['type']) ?? 'token',
    name: item.name,
    description: item.description,
    rarity: item.rarity as DynamicItem['rarity'],
  };
}

/** Fetch an AI reward at the given rarity; fall back to the static table offline. */
async function grantReward(category: string, rarity: Rarity): Promise<DynamicItem> {
  const player = usePlayerStore.getState().player;
  if (await isOnline()) {
    try {
      const result = await ApiDataSource.completeQuest(uuidv4(), {
        category,
        bio: player?.bio ?? '',
        modelPreference: player?.modelPreference ?? 'cloud',
        rarity,
      });
      return apiItemToDomain(result.reward_item);
    } catch {
      // fall through to static loot
    }
  }
  return RewardService.getFallbackReward(category, rarity);
}

/**
 * Quest/dungeon ids whose completion is mid-flight. completeQuest awaits SQLite and
 * often a network reward before state says "completed", so a fast double-tap used to
 * pass the isCompleted check twice and pay XP + loot twice.
 */
const inFlight = new Set<string>();

interface QuestState {
  quests: Quest[]; // today's daily quests
  dungeons: Quest[]; // dungeons available to enter today
  lockedDungeons: Quest[]; // earned dungeons whose unlock date is still pending
  loading: boolean;
  error: string | null;
  lastReward: DynamicItem | null;
  load: () => Promise<void>;
  /** Mark a quest accepted — starts its timer. */
  acceptQuest: (questId: string) => Promise<void>;
  /** Complete a quest. Returns the XP gained and whether it caused a level-up. */
  completeQuest: (questId: string) => Promise<{ leveledUp: boolean; xp: number }>;
  reportDungeon: (questId: string, passed: boolean, score: string | null) => Promise<void>;
  /** Manual daily reset: un-complete today's daily quests so they can be redone. Returns how many were reset. */
  resetTodaysQuests: () => Promise<number>;
  replayPendingMutations: () => Promise<void>;
  reset: () => Promise<void>;
  clearLastReward: () => void;
}

type SetQuestState = (
  partial: Partial<QuestState> | ((state: QuestState) => Partial<QuestState>),
) => void;

async function completeQuestOnce(
  quest: Quest,
  set: SetQuestState,
): Promise<{ leveledUp: boolean; xp: number }> {
  const questId = quest.id;
  // Optimistic local completion.
  await questRepo.completeQuest(questId);
  set((state) => ({
    quests: state.quests.map((q) =>
      q.id === questId ? { ...q, isCompleted: true, completedAt: new Date().toISOString() } : q,
    ),
  }));

  // Apply XP locally (device is source of truth). Then roll the drop — odds scale
  // with the quest's rank: higher rank → fewer empty rolls and better rarities.
  const leveledUp = usePlayerStore.getState().addExperience(quest.xpReward);

  const rarity = rollRewardRarity(quest.difficulty);
  if (rarity) {
    const reward = await grantReward(quest.category, rarity);
    await inventoryRepo.addItem(reward);
    set({ lastReward: reward });
    NotificationService.sendRewardReceived(reward.name, reward.rarity).catch(() => {});
  }

  NotificationService.sendQuestComplete(quest.title, quest.xpReward).catch(() => {});
  if (leveledUp) {
    const lvl = usePlayerStore.getState().player?.level ?? 1;
    NotificationService.sendLevelUp(lvl).catch(() => {});
  }

  // Level change can shift Hunter Rank — recompute and re-read the player.
  await DailyTimelineService.refreshRank();
  await usePlayerStore.getState().refreshFromLocal();

  return { leveledUp, xp: quest.xpReward };
}

async function reportDungeonOnce(
  dungeon: Quest,
  passed: boolean,
  score: string | null,
  set: SetQuestState,
): Promise<void> {
  const questId = dungeon.id;
  const result: DungeonResult = { passed, score, reportedAt: new Date().toISOString() };
  await questRepo.setDungeonResult(questId, result);

  if (passed) {
    const xp = dungeon.dungeonChallenge?.xpReward ?? dungeon.xpReward;
    usePlayerStore.getState().addExperience(xp);
    // Dungeons are boss gates — they always drop, and at the top tier.
    const reward = await grantReward(dungeon.category, 'Legendary');
    await inventoryRepo.addItem(reward);
    set({ lastReward: reward });
    NotificationService.send(
      '[Dungeon Cleared.]',
      `You conquered ${dungeon.title}. The Gate yields its treasure.`,
    ).catch(() => {});
    NotificationService.sendRewardReceived(reward.name, reward.rarity).catch(() => {});
  }

  await DailyTimelineService.refreshRank();
  await usePlayerStore.getState().refreshFromLocal();
  set((state) => ({ dungeons: state.dungeons.filter((d) => d.id !== questId) }));
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: [],
  dungeons: [],
  lockedDungeons: [],
  loading: false,
  error: null,
  lastReward: null,

  load: async () => {
    set({ loading: true, error: null });
    const today = todayDateStr();
    const [todays, dungeons, lockedDungeons] = await Promise.all([
      questRepo.getTodaysQuests(today),
      DungeonService.getAvailableDungeons(),
      DungeonService.getLockedDungeons(),
    ]);
    set({ quests: todays, dungeons, lockedDungeons, loading: false });
  },

  acceptQuest: async (questId: string) => {
    const updated = await questRepo.acceptQuest(questId);
    set((state) => ({
      quests: state.quests.map((q) => (q.id === questId ? updated : q)),
    }));
  },

  completeQuest: async (questId: string) => {
    const quest = get().quests.find((q) => q.id === questId);
    if (!quest || quest.isCompleted || inFlight.has(questId)) return { leveledUp: false, xp: 0 };
    inFlight.add(questId);
    try {
      return await completeQuestOnce(quest, set);
    } finally {
      inFlight.delete(questId);
    }
  },

  reportDungeon: async (questId: string, passed: boolean, score: string | null) => {
    const dungeon = get().dungeons.find((d) => d.id === questId);
    if (!dungeon || inFlight.has(questId)) return;
    inFlight.add(questId);
    try {
      await reportDungeonOnce(dungeon, passed, score, set);
    } finally {
      inFlight.delete(questId);
    }
  },

  resetTodaysQuests: async () => {
    const today = todayDateStr();
    await questRepo.resetDailyQuests(today);
    const todays = await questRepo.getTodaysQuests(today);
    set({ quests: todays });
    return todays.length;
  },

  // Timeline quests are generated upfront and completed locally, so there are no
  // queued completion mutations to replay. Kept for bootstrap compatibility.
  replayPendingMutations: async () => {},

  reset: async () => {
    await questRepo.resetQuests();
    try {
      await ApiDataSource.resetQuests();
    } catch {
      // Continue offline
    }
    set({ quests: [], dungeons: [], lockedDungeons: [] });
  },

  clearLastReward: () => set({ lastReward: null }),
}));
