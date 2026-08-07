import { Goal } from '../models/Goal';
import { Quest } from '../models/Quest';

export interface IGoalRepository {
  /** All active campaigns, most-recent first. */
  getActiveGoals(): Promise<Goal[]>;
  /** Number of campaigns currently in the 'active' status. */
  countActiveGoals(): Promise<number>;
  getGoal(goalId: string): Promise<Goal | null>;
  saveGoal(goal: Goal): Promise<void>;
  /**
   * Persist a campaign — the goal AND its full quest set — in one atomic
   * transaction so a partially-written campaign can never exist.
   */
  saveCampaign(goal: Goal, quests: Quest[]): Promise<void>;
  /** Bump the completed-days counter and return the new value. */
  incrementDaysCompleted(goalId: string): Promise<number>;
  setStatus(goalId: string, status: Goal['status']): Promise<void>;
}
