import { v4 as uuidv4 } from 'uuid';
import { Goal } from '../../domain/models/Goal';
import { DungeonChallenge, Quest } from '../../domain/models/Quest';
import { ApiDataSource } from '../datasources/ApiDataSource';
import { ApiDungeon } from '../datasources/ApiTypes';
import { QuestRepository } from '../repositories/QuestRepository';
import { isOnline } from '../../core/network';
import { addDays, todayDateStr } from '../../core/dateUtils';

const questRepo = new QuestRepository();

function apiDungeonToChallenge(d: ApiDungeon): DungeonChallenge {
  return {
    title: d.title,
    description: d.description,
    instructions: d.instructions,
    successCriteria: d.success_criteria,
    xpReward: d.xp_reward,
    goldReward: d.gold_reward,
    lootRarity: d.loot_rarity,
  };
}

/** Client-side mirror of the backend's synthesize_fallback_dungeon — used offline. */
function fallbackChallenge(goal: Goal): DungeonChallenge {
  const tag = goal.title || 'your goal';
  return {
    title: 'The Proving Gate',
    description: `A shadowed gate materializes. To pass, you must prove real progress toward: ${tag}.`,
    instructions: `Take a full, honest mock test or timed benchmark that measures your current ability at '${tag}'. Do it in one sitting under realistic conditions.`,
    successCriteria:
      'You complete the benchmark and meet the standard you set when you started this campaign.',
    xpReward: 100,
    goldReward: 1000,
    lootRarity: 'Legendary',
  };
}

/** Pick a random day within the next 7 days (today + 1..7), as YYYY-MM-DD. */
function randomUnlockDate(): string {
  const offset = 1 + Math.floor(Math.random() * 7);
  return addDays(todayDateStr(), offset);
}

export const DungeonService = {
  /**
   * Generates a mock-exam Dungeon for the goal and schedules it to unlock on a random
   * day within the next 7 days. Uses the AI backend when online; falls back to a
   * deterministic dungeon offline. Persists it as a `quest_type='dungeon'` quest.
   */
  async generateAndSchedule(goal: Goal, level: number, modelPreference: string): Promise<Quest> {
    let challenge: DungeonChallenge;

    if (await isOnline()) {
      try {
        const res = await ApiDataSource.generateDungeon({
          goal: goal.title,
          context: goal.context,
          level,
          model_preference: modelPreference,
        });
        challenge = apiDungeonToChallenge(res.dungeon);
      } catch {
        challenge = fallbackChallenge(goal);
      }
    } else {
      challenge = fallbackChallenge(goal);
    }

    const dungeon: Quest = {
      id: uuidv4(),
      title: challenge.title,
      description: challenge.description,
      category: 'Discipline',
      difficulty: 'S',
      xpReward: challenge.xpReward,
      goldReward: challenge.goldReward,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      goalId: goal.id,
      scheduledFor: randomUnlockDate(),
      questType: 'dungeon',
      dungeonChallenge: challenge,
      dungeonResult: null,
      acceptedAt: null,
    };

    await questRepo.saveQuests([dungeon]);
    return dungeon;
  },

  /** Dungeons whose unlock date has arrived and that haven't been cleared yet. */
  async getAvailableDungeons(): Promise<Quest[]> {
    const today = todayDateStr();
    const all = await questRepo.getDungeons();
    return all.filter((d) => !d.isCompleted && d.scheduledFor != null && d.scheduledFor <= today);
  },

  /** Future dungeons that have been earned but are still locked (unlock date pending). */
  async getLockedDungeons(): Promise<Quest[]> {
    const today = todayDateStr();
    const all = await questRepo.getDungeons();
    return all.filter((d) => !d.isCompleted && d.scheduledFor != null && d.scheduledFor > today);
  },

  async getAllDungeons(): Promise<Quest[]> {
    return questRepo.getDungeons();
  },
};
