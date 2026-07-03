import { Rank } from '../../core/constants';

export type QuestType = 'daily' | 'dungeon';

/** The AI-authored mock-exam content for a dungeon quest. */
export interface DungeonChallenge {
  title: string;
  description: string;
  instructions: string;
  successCriteria: string;
  xpReward: number;
  goldReward: number;
  lootRarity: string;
}

/** The player's self-reported outcome of attempting a dungeon. */
export interface DungeonResult {
  passed: boolean;
  score: string | null;
  reportedAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Rank;
  xpReward: number;
  goldReward: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  // Goal-timeline fields
  goalId: string | null;
  scheduledFor: string | null; // YYYY-MM-DD — the day this quest is revealed
  questType: QuestType;
  dungeonChallenge: DungeonChallenge | null; // populated only when questType === 'dungeon'
  dungeonResult: DungeonResult | null; // populated after the player self-reports
  acceptedAt: string | null; // ISO time the player tapped Accept; null until accepted
}
