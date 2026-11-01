import { getItem } from '../content/items';
import { poolForArea } from '../content/curriculum';
import { isDue, type SrsItem, type SrsTable } from './schedule';

/** The post-game Daily Trial fights in this pseudo-area: a pool built from the SRS table. */
export const REVIEW_AREA = 'review';
export const REVIEW_POOL_SIZE = 30;
/** Fewer due items than this and the trial tops up with the weakest seen items. */
const MIN_REVIEW_POOL = 12;

/** Ids in a save can outlive content (a renamed word): skip any that no longer resolve. */
function exists(id: string): boolean {
  try {
    getItem(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * The Daily Trial: what the player is closest to forgetting, across every arc.
 * Due items first (lapsed before clean, then most overdue), then, if too few
 * are due, the weakest items they have seen. Never empty: a player with no
 * history gets the N3 finale pool.
 */
export function reviewPool(srs: SrsTable, now: number, limit = REVIEW_POOL_SIZE): string[] {
  const seen = Object.values(srs).filter((it) => it.lastSeenAt > 0 && exists(it.id));
  const urgency = (it: SrsItem) => (it.lapses > 0 ? 1e12 : 0) + (now - it.dueAt);
  const due = seen.filter((it) => isDue(it, now)).sort((a, b) => urgency(b) - urgency(a));
  const picked = due.slice(0, limit).map((it) => it.id);
  const target = Math.min(MIN_REVIEW_POOL, limit);
  if (picked.length < target) {
    const chosen = new Set(picked);
    const weakest = seen
      .filter((it) => !chosen.has(it.id))
      .sort((a, b) => a.stage - b.stage || a.lastSeenAt - b.lastSeenAt);
    picked.push(...weakest.slice(0, target - picked.length).map((it) => it.id));
  }
  return picked.length > 0 ? picked : poolForArea('finale').slice(0, limit);
}

/** What a battle in `areaId` may test: the curriculum pool, or the Daily Trial's. */
export function battlePool(areaId: string, srs: SrsTable, now: number): string[] {
  return areaId === REVIEW_AREA ? reviewPool(srs, now) : poolForArea(areaId);
}
