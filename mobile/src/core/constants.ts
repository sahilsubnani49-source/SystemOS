// Quest difficulty ranks
export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const;
export type Rank = (typeof RANKS)[number];

// Item rarities
export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

// Player stats
export const STAT_KEYS = [
  'strength',
  'agility',
  'stamina',
  'intelligence',
  'perception',
  'discipline',
  'creativity',
  'mindfulness',
] as const;
export type StatKey = (typeof STAT_KEYS)[number];

// AI model preference
export const MODEL_PREFERENCE = {
  LOCAL: 'local',
  CLOUD: 'cloud',
} as const;
export type ModelPreference = (typeof MODEL_PREFERENCE)[keyof typeof MODEL_PREFERENCE];
