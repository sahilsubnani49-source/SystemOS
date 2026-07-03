export type GoalStatus = 'active' | 'completed' | 'abandoned';

/**
 * A goal-driven campaign: the player states what they want to achieve and over how
 * many days. The AI plans it and lays out dated quests across the timeline. The goal
 * row owns the strategic plan, the timeline bounds, and the consistency counter that
 * drives dungeon keys.
 */
export interface Goal {
  id: string;
  title: string;
  description: string;
  context: string;
  durationDays: number;
  startDate: string; // YYYY-MM-DD — day 1 of the campaign
  endDate: string; // YYYY-MM-DD — day N
  plan: string; // Stage-1 strategic plan (prose)
  schedule: string; // Stage-2 day-by-day blueprint (prose)
  daysCompleted: number; // count of fully-completed days — drives key milestones
  status: GoalStatus;
  createdAt: string;
}
