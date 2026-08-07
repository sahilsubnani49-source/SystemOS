import { v4 as uuidv4 } from 'uuid';
import { DynamicItem } from '../../domain/models/DynamicItem';
import { Rank, Rarity } from '../../core/constants';

/**
 * Per-rank drop odds — the device owns these (single source of truth). The rank of the
 * COMPLETED quest steers the roll: higher rank → fewer empty rolls AND a split shifted
 * toward Epic/Legendary. `E` preserves the historical baseline (55% empty; on a drop
 * Common 70 / Rare 22 / Epic 6 / Legendary 2).
 */
interface RankOdds {
  /** Chance the completion drops NO reward at all (XP only). */
  noReward: number;
  /** Given a reward DOES drop, the probability of each top tier. Common is the remainder. */
  legendary: number;
  epic: number;
  rare: number;
}

const RANK_DROP_ODDS: Record<Rank, RankOdds> = {
  // E anchors the low end (== the old fixed odds); S anchors the top end.
  // D–A interpolate the ramp: noReward strictly falls, legendary/epic/rare strictly
  // rise, and legendary+epic+rare stays ≤ 1 at every rank (Common is the remainder).
  E: { noReward: 0.55, legendary: 0.02, epic: 0.06, rare: 0.22 },
  D: { noReward: 0.45, legendary: 0.07, epic: 0.11, rare: 0.24 },
  C: { noReward: 0.36, legendary: 0.12, epic: 0.16, rare: 0.27 },
  B: { noReward: 0.27, legendary: 0.17, epic: 0.23, rare: 0.28 },
  A: { noReward: 0.18, legendary: 0.23, epic: 0.27, rare: 0.29 },
  S: { noReward: 0.08, legendary: 0.28, epic: 0.32, rare: 0.3 },
};

/**
 * Rolls the reward rarity for a completed quest of the given rank, or null for
 * "no reward". Mirrored (baseline only) by _pick_rarity() in backend reward_generator.py.
 */
export function rollRewardRarity(rank: Rank): Rarity | null {
  const odds = RANK_DROP_ODDS[rank] ?? RANK_DROP_ODDS.E;
  if (Math.random() < odds.noReward) return null;
  const r = Math.random();
  if (r < odds.legendary) return 'Legendary';
  if (r < odds.legendary + odds.epic) return 'Epic';
  if (r < odds.legendary + odds.epic + odds.rare) return 'Rare';
  return 'Common';
}

/**
 * Static fallback reward table — used when the backend / AI is unavailable.
 * Rewards are real-world indulgence coupons (tokens & potions), not stat gear.
 * The quest category gives a light hint at which reward fits.
 */

interface FallbackEntry {
  type: DynamicItem['type'];
  name: string;
  description: string;
}

const FALLBACK_TABLE: Record<string, FallbackEntry> = {
  stamina: {
    type: 'token',
    name: 'Token of Leisure',
    description: 'Spend 10 minutes on a hobby purely for joy — no goals, just fun.',
  },
  agility: {
    type: 'token',
    name: 'Token of Leisure',
    description: 'Spend 10 minutes on a hobby purely for joy — no goals, just fun.',
  },
  strength: {
    type: 'token',
    name: 'Token of Indulgence',
    description: 'Enjoy a favorite snack or treat you have been putting off.',
  },
  intelligence: {
    type: 'potion',
    name: 'Potion of Stillness',
    description: 'Step away from the screen and do nothing but rest for 10 minutes.',
  },
  discipline: {
    type: 'token',
    name: 'Token of Gaming',
    description: 'Play your favorite game, guilt-free, for 10 minutes.',
  },
  creativity: {
    type: 'token',
    name: 'Token of Leisure',
    description: 'Spend 10 minutes creating something just for the fun of it.',
  },
  perception: {
    type: 'token',
    name: 'Token of Friendship',
    description: 'Call or message a friend and chat freely for 10 minutes.',
  },
  mindfulness: {
    type: 'potion',
    name: 'Potion of Sleep',
    description: 'Take a guilt-free 10-minute nap or quiet unplug to recharge.',
  },
};

const DEFAULT_FALLBACK: FallbackEntry = {
  type: 'potion',
  name: 'Potion of Respite',
  description: 'Take a guilt-free 10-minute break to do whatever restores you.',
};

export const RewardService = {
  /**
   * Returns a static fallback reward (token / potion) based on the quest category,
   * at the given rarity (defaults to Common for the modest offline path).
   */
  getFallbackReward(category: string, rarity: Rarity = 'Common'): DynamicItem {
    const key = category.toLowerCase();
    const entry =
      FALLBACK_TABLE[key] ??
      Object.entries(FALLBACK_TABLE).find(([k]) => key.includes(k))?.[1] ??
      DEFAULT_FALLBACK;

    return {
      id: uuidv4(),
      type: entry.type,
      name: entry.name,
      description: entry.description,
      rarity,
    };
  },
};
