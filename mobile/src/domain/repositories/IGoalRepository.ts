import { Goal } from '../models/Goal';

export interface IGoalRepository {
  /** All active campaigns, most-recent first. */
  getActiveGoals(): Promise<Goal[]>;
  /** Number of campaigns currently in the 'active' status. */
  countActiveGoals(): Promise<number>;
  getGoal(goalId: string): Promise<Goal | null>;
  saveGoal(goal: Goal): Promise<void>;
  /** Bump the completed-days counter and return the new value. */
  incrementDaysCompleted(goalId: string): Promise<number>;
  setStatus(goalId: string, status: Goal['status']): Promise<void>;
}
