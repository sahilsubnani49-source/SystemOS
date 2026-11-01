import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Goal } from '../../domain/models/Goal';
import { Quest } from '../../domain/models/Quest';
import { Rank } from '../../core/constants';
import { GoalRepository } from '../../data/repositories/GoalRepository';
import { QuestRepository } from '../../data/repositories/QuestRepository';
import { ApiDataSource } from '../../data/datasources/ApiDataSource';
import { ApiQuest, ApiGoalPlanResponse } from '../../data/datasources/ApiTypes';
import {
  DailyTimelineService,
  LAST_DAILY_NOTIFICATION_DATE,
  PENALTY_NOTICE_KEY,
  TimelineTickResult,
} from '../../data/services/DailyTimelineService';
import { deleteMeta } from '../../data/services/AppMeta';
import { NotificationService } from '../../core/NotificationService';
import { isOnline } from '../../core/network';
import { addDays, todayDateStr } from '../../core/dateUtils';
import { usePlayerStore } from './usePlayerStore';
import { useQuestStore } from './useQuestStore';
import { useInventoryStore } from './useInventoryStore';
import { useTimeLogStore } from './useTimeLogStore';

const goalRepo = new GoalRepository();
const questRepo = new QuestRepository();

export interface CreateGoalInput {
  goal: string;
  context: string;
  durationDays: number;
  questsPerDay?: number;
}

/**
 * A campaign strategy drafted by the Architect and awaiting the Hunter's approval.
 * Held in memory only — deliberately NOT persisted, so an unapproved draft is lost
 * on app kill (accepted trade-off to avoid resurrecting stale, half-reviewed plans).
 */
export interface DraftPlan {
  goal: string;
  context: string;
  durationDays: number;
  questsPerDay: number;
  plan: string;
  aiGenerated: boolean;
}

/** Map an API campaign quest (carrying day_index) to a dated domain Quest. */
function apiQuestToDatedQuest(q: ApiQuest, goalId: string, startDate: string): Quest {
  const dayIndex = q.day_index && q.day_index > 0 ? q.day_index : 1;
  return {
    id: q.id || uuidv4(),
    title: q.title,
    description: q.description ?? '',
    category: q.category,
    difficulty: (q.difficulty as Rank) ?? 'E',
    xpReward: q.xp_reward,
    goldReward: q.gold_reward,
    isCompleted: q.is_completed ?? false,
    createdAt: new Date().toISOString(),
    completedAt: null,
    goalId,
    scheduledFor: addDays(startDate, dayIndex - 1),
    questType: 'daily',
    dungeonChallenge: null,
    dungeonResult: null,
    acceptedAt: null,
  };
}

/**
 * Persist a freshly-forged campaign to SQLite and announce it.
 * Shared by both the no-review `createGoal` fallback and the reviewed
 * `approveDraftPlan` flow so the persistence tail lives in exactly one place.
 * Returns the refreshed active-goals list for the caller to commit to state.
 */
async function persistCampaign(
  fields: { goal: string; context: string; durationDays: number },
  response: ApiGoalPlanResponse,
): Promise<Goal[]> {
  const startDate = todayDateStr();
  const goalId = uuidv4();
  // Only the FIRST campaign initializes the timeline cursor; a 2nd/3rd must NOT move it.
  const activeCount = await goalRepo.countActiveGoals();

  const quests = response.quests.map((q) => apiQuestToDatedQuest(q, goalId, startDate));

  const goal: Goal = {
    id: goalId,
    title: fields.goal,
    description: '',
    context: fields.context,
    durationDays: fields.durationDays,
    startDate,
    endDate: addDays(startDate, fields.durationDays - 1),
    plan: response.plan ?? '',
    schedule: response.schedule ?? '',
    daysCompleted: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  // Goal + quests land in ONE transaction; the timeline cursor moves only after
  // the commit so a crash can never leave a campaign without its daily work.
  await goalRepo.saveCampaign(goal, quests);
  if (activeCount === 0) await DailyTimelineService.markStart();
  await DailyTimelineService.refreshRank();

  const goals = await goalRepo.getActiveGoals();

  NotificationService.send(
    '[New Campaign Initiated.]',
    `${quests.length} quests forged across ${fields.durationDays} days. The path is set, Hunter.`,
  ).catch(() => {});

  return goals;
}

interface GoalState {
  activeGoals: Goal[];
  creating: boolean;
  planning: boolean;
  draftPlan: DraftPlan | null;
  error: string | null;
  load: () => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<void>;
  /** Ask the Architect for a reviewable strategy (does not forge quests yet). */
  generateDraftPlan: (input: CreateGoalInput) => Promise<void>;
  /** Ask the Architect to revise the current draft given feedback. */
  regenerateDraftPlan: (feedback: string) => Promise<void>;
  /** Manually overwrite the draft's plan text. */
  setDraftPlanText: (text: string) => void;
  /** Throw away the pending draft and return to the form. */
  discardDraftPlan: () => void;
  /** Forge quests FROM the approved draft, then persist like createGoal. */
  approveDraftPlan: () => Promise<void>;
  clearError: () => void;
  /** Wipe every goal and clear timeline/reset meta cursors. */
  wipeAll: () => Promise<void>;
  /** Abandon one campaign and delete its quests. */
  abandonCampaign: (goalId: string) => Promise<void>;
  /** Run the daily timeline tick and refresh player/quests/goal state. */
  advanceTimeline: () => Promise<TimelineTickResult>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  activeGoals: [],
  creating: false,
  planning: false,
  draftPlan: null,
  error: null,

  load: async () => {
    const goals = await goalRepo.getActiveGoals();
    set({ activeGoals: goals });
  },

  createGoal: async (input: CreateGoalInput) => {
    const online = await isOnline();
    if (!online) throw new Error('No connection — go online to forge a campaign.');

    const player = usePlayerStore.getState().player;
    const level = player?.level ?? 1;
    const modelPreference = player?.modelPreference ?? 'cloud';

    set({ creating: true, error: null });
    try {
      const activeCount = await goalRepo.countActiveGoals();
      if (activeCount >= 3) {
        throw new Error('You can run at most 3 campaigns. Abandon one first.');
      }

      const response = await ApiDataSource.generateGoalPlan({
        goal: input.goal,
        context: input.context,
        duration_days: input.durationDays,
        level,
        model_preference: modelPreference,
        quests_per_day: input.questsPerDay ?? 2,
      });

      const goals = await persistCampaign(
        { goal: input.goal, context: input.context, durationDays: input.durationDays },
        response,
      );
      set({ activeGoals: goals, creating: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Campaign generation failed.';
      set({ creating: false, error: message });
      throw e;
    }
  },

  generateDraftPlan: async (input: CreateGoalInput) => {
    const online = await isOnline();
    if (!online) throw new Error('No connection — go online to forge a campaign.');

    const player = usePlayerStore.getState().player;
    const level = player?.level ?? 1;
    const modelPreference = player?.modelPreference ?? 'cloud';

    set({ planning: true, error: null });
    try {
      const activeCount = await goalRepo.countActiveGoals();
      if (activeCount >= 3) {
        throw new Error('You can run at most 3 campaigns. Abandon one first.');
      }

      const questsPerDay = input.questsPerDay ?? 2;
      const response = await ApiDataSource.generateGoalStrategy({
        goal: input.goal,
        context: input.context,
        duration_days: input.durationDays,
        level,
        model_preference: modelPreference,
        quests_per_day: questsPerDay,
      });

      if (response.plan === '') {
        throw new Error('The Architect is unreachable. Forge without review, or try again later.');
      }

      set({
        planning: false,
        draftPlan: {
          goal: input.goal,
          context: input.context,
          durationDays: input.durationDays,
          questsPerDay,
          plan: response.plan,
          aiGenerated: response.ai_generated,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Strategy drafting failed.';
      set({ planning: false, error: message });
      throw e;
    }
  },

  regenerateDraftPlan: async (feedback: string) => {
    const draft = get().draftPlan;
    if (!draft) throw new Error('No strategy to revise, Hunter.');

    const player = usePlayerStore.getState().player;
    const level = player?.level ?? 1;
    const modelPreference = player?.modelPreference ?? 'cloud';

    set({ planning: true, error: null });
    try {
      const response = await ApiDataSource.generateGoalStrategy({
        goal: draft.goal,
        context: draft.context,
        duration_days: draft.durationDays,
        level,
        model_preference: modelPreference,
        quests_per_day: draft.questsPerDay,
        previous_plan: draft.plan,
        feedback,
      });

      if (response.plan === '') {
        throw new Error('The Architect is unreachable. Forge without review, or try again later.');
      }

      // Preserve the Hunter's goal/duration/context — only the plan text changes.
      set({
        planning: false,
        draftPlan: { ...draft, plan: response.plan, aiGenerated: response.ai_generated },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Strategy revision failed.';
      set({ planning: false, error: message });
      throw e;
    }
  },

  setDraftPlanText: (text: string) => {
    const draft = get().draftPlan;
    if (!draft) return;
    set({ draftPlan: { ...draft, plan: text } });
  },

  discardDraftPlan: () => set({ draftPlan: null, error: null }),

  approveDraftPlan: async () => {
    const draft = get().draftPlan;
    if (!draft) throw new Error('No strategy to forge, Hunter.');

    const player = usePlayerStore.getState().player;
    const level = player?.level ?? 1;
    const modelPreference = player?.modelPreference ?? 'cloud';

    set({ creating: true, error: null });
    try {
      const response = await ApiDataSource.generateGoalPlan({
        goal: draft.goal,
        context: draft.context,
        duration_days: draft.durationDays,
        level,
        model_preference: modelPreference,
        quests_per_day: draft.questsPerDay,
        approved_plan: draft.plan,
      });

      const goals = await persistCampaign(
        { goal: draft.goal, context: draft.context, durationDays: draft.durationDays },
        response,
      );
      set({ activeGoals: goals, creating: false, draftPlan: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Campaign generation failed.';
      // Keep the draft on failure — an edited plan must never be lost.
      set({ creating: false, error: message });
      throw e;
    }
  },

  clearError: () => set({ error: null }),

  wipeAll: async () => {
    // Focus logs outlive their campaign: the description was denormalized at start,
    // so history stays readable — only the dangling link is severed.
    for (const goal of get().activeGoals) {
      await useTimeLogStore.getState().detachGoal(goal.id);
    }
    await goalRepo.deleteAllGoals();
    await deleteMeta('last_timeline_date');
    await deleteMeta(LAST_DAILY_NOTIFICATION_DATE);
    // A pending penalty notice would otherwise greet the freshly-reset Hunter.
    await deleteMeta(PENALTY_NOTICE_KEY);
    set({ activeGoals: [] });
  },

  abandonCampaign: async (goalId: string) => {
    await useTimeLogStore.getState().detachGoal(goalId);
    await questRepo.deleteQuestsForGoal(goalId);
    await goalRepo.deleteGoal(goalId);
    const remaining = await goalRepo.countActiveGoals();
    // Only clear the cursor when NO active campaigns remain.
    if (remaining === 0) await deleteMeta('last_timeline_date');
    const goals = await goalRepo.getActiveGoals();
    set({ activeGoals: goals });
  },

  advanceTimeline: async () => {
    const result = await DailyTimelineService.tick();
    await usePlayerStore.getState().refreshFromLocal();
    await useQuestStore.getState().load();
    // A tick may have enforced the penalty and wiped the inventory.
    if (result.penaltyApplied) await useInventoryStore.getState().load();
    await get().load();
    return result;
  },
}));
