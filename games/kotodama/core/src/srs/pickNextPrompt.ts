import type { Rng } from '../util/rng';
import { isDue, type SrsTable } from './schedule';

/**
 * Choose which item the next battle prompt tests, from `pool` (the kana this
 * encounter is allowed to use).
 *
 * Priority, highest first:
 *   1. Overdue items the player has failed before (lapses): fix weaknesses first.
 *   2. Any due item, the most overdue first.
 *   3. Never-seen items: introduce something new.
 *   4. Otherwise the lowest-stage item, so nothing feels "finished" too early.
 * Ties are broken randomly so the same encounter doesn't always open the same way.
 * `avoid` (usually the last prompt's id) is skipped whenever another choice exists.
 */
export function pickNextPrompt(
  pool: readonly string[],
  table: SrsTable,
  now: number,
  rng: Rng,
  avoid?: string,
): string {
  if (pool.length === 0) throw new Error('pickNextPrompt: empty pool');
  const candidates = pool.length > 1 && avoid !== undefined ? pool.filter((id) => id !== avoid) : [...pool];

  const score = (id: string): number => {
    const item = table[id];
    if (!item) return 2_000; // new
    if (isDue(item, now)) {
      const overdueHours = (now - item.dueAt) / 3_600_000;
      return (item.lapses > 0 ? 4_000 : 3_000) + Math.min(overdueHours, 999);
    }
    return 1_000 - item.stage * 100;
  };

  let best: string[] = [];
  let bestScore = -Infinity;
  for (const id of candidates) {
    // Bucket scores so "about equally urgent" items tie and get randomized.
    const s = Math.floor(score(id) / 50);
    if (s > bestScore) {
      bestScore = s;
      best = [id];
    } else if (s === bestScore) {
      best.push(id);
    }
  }
  return rng.pick(best);
}
