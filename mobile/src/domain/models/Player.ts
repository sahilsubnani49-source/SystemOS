import { ModelPreference, StatKey } from '../../core/constants';

export type PlayerStats = Record<StatKey, number>;

export interface Player {
  id: string;
  name: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: PlayerStats;
  bio: string | null;
  aspirations: string | null;
  modelPreference: ModelPreference;
  rank: string; // Hunter Rank, e.g. "E-Rank" … "S-Rank"
  keys: number; // dungeon keys earned (1 per 21 completed days)
}
