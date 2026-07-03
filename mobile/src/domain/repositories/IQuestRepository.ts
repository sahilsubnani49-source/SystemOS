import { DungeonResult, Quest } from '../models/Quest';

export interface IQuestRepository {
  getQuests(): Promise<Quest[]>;
  saveQuests(quests: Quest[]): Promise<void>;
  completeQuest(questId: string): Promise<Quest>;
  /** Mark a quest as accepted (starts its timer). */
  acceptQuest(questId: string): Promise<Quest>;
  resetQuests(): Promise<void>;
  // Goal-timeline queries
  /** Daily quests scheduled for the given YYYY-MM-DD date. */
  getTodaysQuests(dateStr: string): Promise<Quest[]>;
  /** Daily quests for ONE goal scheduled on a given YYYY-MM-DD date. */
  getDailyQuestsForGoal(goalId: string, dateStr: string): Promise<Quest[]>;
  /** Daily quests scheduled for a date on or before `dateStr` (for streak/day checks). */
  getDailyQuestsUpTo(dateStr: string): Promise<Quest[]>;
  /** All dungeon-type quests (mock-exam gates). */
  getDungeons(): Promise<Quest[]>;
  /** Un-complete the daily quests scheduled for a given date (manual daily reset). */
  resetDailyQuests(dateStr: string): Promise<void>;
  /** Record the player's self-reported dungeon outcome and mark it complete. */
  setDungeonResult(questId: string, result: DungeonResult): Promise<Quest>;
}
