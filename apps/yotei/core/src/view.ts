import { addDays, toDays, wall, wallDate } from './dates';
import type { Plan, PlanItem, WallTime } from './types';

// "What do I have to do now?" Computed at read time from the stored items and the
// user's current wall-clock time, so the content changes by itself as hours, days
// and weeks pass. Nothing is rescheduled: a missed item stays missed (Overdue).

export interface NowView {
  phase: 'before' | 'active' | 'finished';
  /** The span being shown: today (hour plans) or the current plan week (everything else). */
  window: { start: WallTime; end: WallTime; kind: 'day' | 'week'; index: number; total: number };
  /** Happening right now. */
  current: PlanItem[];
  /** The rest of this window: later today/this week, plus anything already ticked off in it. */
  later: PlanItem[];
  /** Ended and not done, from any earlier time. Oldest first. */
  overdue: PlanItem[];
  /** The first items after this window. */
  upNext: PlanItem[];
  /** When this view goes stale: recompute at this wall time. */
  nextChange: WallTime;
}

const UP_NEXT = 5;

export function currentView(plan: Plan, items: PlanItem[], now: WallTime): NowView {
  const startDate = wallDate(plan.start);
  const endDate = wallDate(plan.end);
  const phase = now < plan.start ? 'before' : now >= plan.end ? 'finished' : 'active';
  // Before the start, show the first window; after the end, the last one.
  const at = phase === 'before' ? plan.start : phase === 'finished' ? latest(plan) : now;

  let window: NowView['window'];
  if (plan.unit === 'hour') {
    const day = wallDate(at);
    const index = toDays(day) - toDays(startDate) + 1;
    const total = Math.max(1, toDays(endDate) - toDays(startDate) + (plan.end.endsWith('T00:00') ? 0 : 1));
    window = { start: wall(day), end: wall(addDays(day, 1)), kind: 'day', index, total };
  } else {
    const k = Math.floor((toDays(wallDate(at)) - toDays(startDate)) / 7);
    const ws = addDays(startDate, 7 * k);
    const total = Math.max(1, Math.ceil((toDays(endDate) - toDays(startDate)) / 7));
    window = { start: wall(ws), end: wall(addDays(ws, 7)), kind: 'week', index: k + 1, total };
  }

  const overlaps = (it: PlanItem) => it.start < window.end && it.end > window.start;
  const isCurrent = (it: PlanItem) => phase === 'active' && it.start <= now && now < it.end;
  const ended = (it: PlanItem) => it.end <= now;

  const current = items.filter((it) => overlaps(it) && isCurrent(it));
  const later = items.filter((it) => overlaps(it) && !isCurrent(it) && (!ended(it) || it.doneAt !== null));
  const overdue = items.filter((it) => ended(it) && it.doneAt === null);
  const upNext = items.filter((it) => it.start >= window.end).slice(0, UP_NEXT);

  return { phase, window, current, later, overdue, upNext, nextChange: nextChange(plan, items, now, window.end) };
}

/** The earliest moment after `now` at which any part of the view changes. */
function nextChange(plan: Plan, items: PlanItem[], now: WallTime, windowEnd: WallTime): WallTime {
  let next = windowEnd;
  const consider = (t: WallTime) => {
    if (t > now && t < next) next = t;
  };
  consider(plan.start);
  consider(plan.end);
  for (const it of items) {
    consider(it.start);
    consider(it.end);
  }
  return next;
}

/** The last instant inside the plan, for showing its final window once it is over. */
function latest(plan: Plan): WallTime {
  // plan.end is exclusive; a minute earlier is still inside.
  const d = wallDate(plan.end);
  return plan.end.endsWith('T00:00') ? `${addDays(d, -1)}T23:59` : plan.end;
}

/** Progress over the whole plan. */
export function progress(items: PlanItem[]): { done: number; total: number } {
  return { done: items.filter((i) => i.doneAt !== null).length, total: items.length };
}
