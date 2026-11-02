import {
  addDays,
  addMinutes,
  addUnits,
  isValidDate,
  isValidTime,
  minutesBetween,
  toMinutes,
  wall,
  wallDate,
  weekday,
} from './dates';
import { hashText } from './text';
import type { DraftItem, DraftPeriod, Plan, PlanDraft, PlanItem, Rejection, Unit, WallTime } from './types';

/** The planner states no time limit. Yotei never invents one. */
export class NoTimeLimitError extends Error {
  constructor() {
    super('This planner has no time limit. Add one (for example "12-week plan" or "by 2026-12-31") and import it again.');
    this.name = 'NoTimeLimitError';
  }
}

export interface ResolveOptions {
  /** YYYY-MM-DD the plan starts, chosen by the user (ignored if the planner states a start date). */
  startDate: string;
  /** HH:mm, for plans counted in hours ("Hour 1"). Default 00:00. */
  startTime?: string;
  /** IANA zone at import, recorded on the plan. */
  timezone: string;
  sourceMd: string;
  makeId: () => string;
  nowIso: string;
}

export interface ResolvedPlan {
  plan: Plan;
  items: PlanItem[];
  /** Items whose stated timing can't be placed inside the plan. Shown, never guessed. */
  problems: Rejection[];
}

const isPositiveInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1;

/** Turn a verified draft into dated items. Every date comes from the planner's own words. */
export function resolvePlan(draft: PlanDraft, opts: ResolveOptions): ResolvedPlan {
  if (!draft.boundaryQuote?.trim()) throw new NoTimeLimitError();

  const startDate = isValidDate(draft.startDate) ? draft.startDate : opts.startDate;
  if (!isValidDate(startDate)) throw new Error(`Invalid start date: ${startDate}`);
  const startTime = isValidTime(opts.startTime) ? opts.startTime : '00:00';
  const planStart = wall(startDate, startTime);

  let planEnd: WallTime;
  if (isValidDate(draft.endDate)) {
    planEnd = wall(addDays(draft.endDate, 1));
  } else if (draft.horizon && isPositiveInt(draft.horizon.length)) {
    const { unit, length } = draft.horizon;
    planEnd = unit === 'hour' ? addMinutes(planStart, 60 * length) : wall(addUnits(startDate, unit, length), startTime);
  } else {
    throw new NoTimeLimitError();
  }
  if (planEnd <= planStart) throw new Error('The planner ends before it starts.');

  const plan: Plan = {
    id: opts.makeId(),
    title: draft.title.trim() || 'Untitled plan',
    sourceMd: opts.sourceMd,
    sourceHash: hashText(opts.sourceMd),
    timezone: opts.timezone,
    unit: draft.horizon?.unit ?? dominantUnit(draft.items),
    start: planStart,
    end: planEnd,
    boundaryQuote: draft.boundaryQuote,
    createdAt: opts.nowIso,
    archived: false,
  };

  const items: PlanItem[] = [];
  const problems: Rejection[] = [];
  draft.items.forEach((item, order) => {
    const span = resolveSpan(item.period, startDate, planStart);
    if ('problem' in span) {
      problems.push({ quote: item.quote, reason: span.problem });
      return;
    }
    if (span.start < planStart || span.start >= planEnd) {
      problems.push({ quote: item.quote, reason: `"${item.periodQuote}" is outside the plan's time limit` });
      return;
    }
    items.push({
      id: opts.makeId(),
      planId: plan.id,
      text: item.quote,
      periodQuote: item.periodQuote,
      unit: item.period.unit,
      start: span.start,
      // Code-computed spans ("Year 2") are trimmed to the plan's stated end. A clock slot
      // the planner wrote ("22:00-01:00") is kept exactly as written, even if it runs past.
      end: !span.timed && span.end > planEnd ? planEnd : span.end,
      timed: span.timed,
      sort: order,
      doneAt: null,
    });
  });
  items.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.sort - b.sort));
  items.forEach((it, i) => (it.sort = i));
  return { plan, items, problems };
}

type Span = { start: WallTime; end: WallTime; timed: boolean } | { problem: string };

function resolveSpan(p: DraftPeriod, startDate: string, planStart: WallTime): Span {
  if (p.timeStart != null && !isValidTime(p.timeStart)) return { problem: `Unreadable time "${p.timeStart}"` };
  if (p.timeEnd != null && !isValidTime(p.timeEnd)) return { problem: `Unreadable time "${p.timeEnd}"` };

  // Absolute: the planner wrote a calendar date.
  if (p.date != null) {
    if (!isValidDate(p.date)) return { problem: `Unreadable date "${p.date}"` };
    if (p.endDate != null && (!isValidDate(p.endDate) || p.endDate < p.date)) {
      return { problem: `Unreadable end date "${p.endDate}"` };
    }
    return daySpan(p.date, p, p.endDate ?? p.date);
  }

  // Relative: "Week 3", "Day 12", "Hour 2".
  if (!isPositiveInt(p.index)) return { problem: 'The planner gives no date or position for this item' };
  const i = p.index;
  switch (p.unit) {
    case 'hour': {
      const start = addMinutes(planStart, 60 * (i - 1));
      return { start, end: addMinutes(start, 60), timed: true };
    }
    case 'day':
      return daySpan(addDays(startDate, i - 1), p);
    case 'week': {
      const base = addDays(startDate, 7 * (i - 1));
      if (p.weekday != null) {
        if (!Number.isInteger(p.weekday) || p.weekday < 1 || p.weekday > 7) return { problem: 'Unreadable weekday' };
        // The day with that weekday inside this plan week.
        for (let d = 0; d < 7; d++) {
          const date = addDays(base, d);
          if (weekday(date) === p.weekday) return daySpan(date, p);
        }
      }
      return { start: wall(base), end: wall(addDays(base, 7)), timed: false };
    }
    case 'month':
    case 'year': {
      const unit = p.unit as Exclude<Unit, 'hour'>;
      return { start: wall(addUnits(startDate, unit, i - 1)), end: wall(addUnits(startDate, unit, i)), timed: false };
    }
  }
}

/** One calendar day (or a run of days), narrowed to a clock slot when times are given. */
function daySpan(date: string, p: DraftPeriod, lastDate: string = date): Span {
  if (p.timeStart) {
    const start = wall(date, p.timeStart);
    let end: WallTime;
    if (p.timeEnd) {
      end = wall(date, p.timeEnd);
      // "22:00-01:00" crosses midnight.
      if (toMinutes(p.timeEnd) <= toMinutes(p.timeStart)) end = wall(addDays(date, 1), p.timeEnd);
    } else {
      end = addMinutes(start, 60); // a start time alone marks a one-hour slot
    }
    return { start, end, timed: true };
  }
  return { start: wall(date), end: wall(addDays(lastDate, 1)), timed: false };
}

function dominantUnit(items: DraftItem[]): Unit {
  const counts = new Map<Unit, number>();
  for (const it of items) counts.set(it.period.unit, (counts.get(it.period.unit) ?? 0) + 1);
  let best: Unit = 'day';
  let max = -1;
  for (const [u, n] of counts) if (n > max) [best, max] = [u, n];
  return best;
}

/** Human length of a span, e.g. "2h", "3 days". */
export function spanLabel(start: WallTime, end: WallTime): string {
  const mins = minutesBetween(start, end);
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  const days = Math.round(mins / 1440);
  return `${days} day${days === 1 ? '' : 's'}`;
}

export { wallDate };
