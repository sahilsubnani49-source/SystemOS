import { addDays, addMinutes, addMonths, addUnits, minutesBetween, toDays, toMinutes, wall, weekday } from './dates';
import { WEEKDAYS, type PlanSpec, type Repeat, type TaskRange, type TaskSpec } from './planJson';
import type { Issue, Plan, PlanItem, Unit, WallTime } from './types';

// Turn a validated PlanSpec into dated items. All date arithmetic happens here, in code,
// from the plan's start: an LLM only ever says "week 3, wednesday", never a computed date.

/** A plan this big is almost certainly a mistake (and would bog down the device). */
export const MAX_ITEMS = 5000;

export interface ResolveOptions {
  /** YYYY-MM-DD the plan starts, chosen by the user (ignored if the JSON states "start"). */
  startDate: string;
  /** IANA zone at import, recorded on the plan. */
  timezone: string;
  /** The JSON as imported, kept so the user can always see and copy it. */
  source: string;
  makeId: () => string;
  nowIso: string;
}

export interface ResolvedPlan {
  plan: Plan;
  items: PlanItem[];
  /** Tasks that fall outside the plan, shown to the user, never moved. */
  skipped: Issue[];
}

export function resolvePlan(spec: PlanSpec, opts: ResolveOptions): ResolvedPlan {
  const startDate = spec.start ?? opts.startDate;
  const planStart = wall(startDate);
  const endDate = spec.end ? addDays(spec.end, 1) : addUnits(startDate, spec.duration!.unit, spec.duration!.count);
  const planEnd = wall(endDate);
  if (planEnd <= planStart) throw new Error('The plan ends before it starts.');

  const plan: Plan = {
    id: opts.makeId(),
    title: spec.title,
    source: opts.source,
    sourceHash: hashText(opts.source),
    timezone: opts.timezone,
    unit: spec.duration?.unit ?? 'day',
    start: planStart,
    end: planEnd,
    limit: spec.duration
      ? `${spec.duration.count} ${spec.duration.unit}${spec.duration.count === 1 ? '' : 's'}`
      : `until ${spec.end}`,
    createdAt: opts.nowIso,
    archived: false,
  };

  const items: PlanItem[] = [];
  const skipped: Issue[] = [];
  let order = 0;
  for (const task of spec.tasks) {
    const spans = taskSpans(task, startDate, endDate);
    if (typeof spans === 'string') {
      skipped.push({ path: task.path, message: `"${task.task}": ${spans}` });
      continue;
    }
    const timing = timingLabel(task.range, task.repeat);
    for (const s of spans) {
      items.push({
        id: '',
        planId: plan.id,
        text: task.task,
        timing,
        notes: task.notes,
        phase: task.phase,
        unit: itemUnit(task.range),
        start: s.start,
        end: s.end,
        timed: s.timed,
        sort: order++,
        doneAt: null,
      });
    }
    if (items.length > MAX_ITEMS) {
      throw new Error(`This plan makes more than ${MAX_ITEMS.toLocaleString()} dated tasks. Shorten it, or repeat less often.`);
    }
  }

  items.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.sort - b.sort));
  items.forEach((it, i) => {
    it.id = opts.makeId();
    it.sort = i;
  });
  return { plan, items, skipped };
}

type Span = { start: WallTime; end: WallTime; timed: boolean };

/** Every dated occurrence of a task, or why it has none. Dates are YYYY-MM-DD; ends exclusive. */
function taskSpans(task: TaskSpec, planStart: string, planEnd: string): Span[] | string {
  const r = rangeDates(task.range, planStart, planEnd);

  if (!task.repeat) {
    if (r.start < planStart || r.start >= planEnd) return 'its timing falls outside the plan';
    const single = r.end === addDays(r.start, 1);
    if (single && task.time) return [slot(r.start, task.time, task.endTime)];
    // A computed span ("weeks 2-4") is trimmed to the plan's end; it never runs past it.
    return [{ start: wall(r.start), end: wall(r.end < planEnd ? r.end : planEnd), timed: false }];
  }

  // Repeats fill the task's range, clipped to the plan.
  const from = r.start > planStart ? r.start : planStart;
  const to = r.end < planEnd ? r.end : planEnd;
  if (from >= to) return 'its range falls outside the plan';

  const spans: Span[] = [];
  if (task.repeat === 'weekly' || task.repeat === 'monthly') {
    // One span per plan week / plan month, counted from the plan's own start.
    for (let k = 0; ; k++) {
      const ps = task.repeat === 'weekly' ? addDays(planStart, 7 * k) : addMonths(planStart, k);
      const pe = task.repeat === 'weekly' ? addDays(planStart, 7 * (k + 1)) : addMonths(planStart, k + 1);
      if (ps >= to) break;
      if (pe <= from) continue;
      spans.push({ start: wall(ps > from ? ps : from), end: wall(pe < to ? pe : to), timed: false });
    }
  } else {
    const days = repeatDays(task.repeat);
    for (let d = from; d < to; d = addDays(d, 1)) {
      if (!days.has(weekday(d))) continue;
      spans.push(task.time ? slot(d, task.time, task.endTime) : { start: wall(d), end: wall(addDays(d, 1)), timed: false });
    }
  }
  return spans.length > 0 ? spans : 'none of its repeat days fall inside the plan';
}

/** The calendar days a range covers, [start, end). */
function rangeDates(r: TaskRange, planStart: string, planEnd: string): { start: string; end: string } {
  if (r.kind === 'date') return { start: r.start, end: addDays(r.end, 1) };
  if (r.kind === 'plan') return { start: planStart, end: planEnd };
  if (r.unit === 'week' && r.weekday !== null) {
    // That weekday inside plan week `from` (a plan week starts on the plan's start day).
    const base = addDays(planStart, 7 * (r.from - 1));
    const offset = (r.weekday - weekday(base) + 7) % 7;
    const day = addDays(base, offset);
    return { start: day, end: addDays(day, 1) };
  }
  if (r.unit === 'day') return { start: addDays(planStart, r.from - 1), end: addDays(planStart, r.to) };
  return { start: addUnits(planStart, r.unit, r.from - 1), end: addUnits(planStart, r.unit, r.to) };
}

/** A clock slot on one day. A start time alone marks a one-hour slot; "22:00-01:00" crosses midnight. */
function slot(date: string, time: string, endTime: string | null): Span {
  const start = wall(date, time);
  if (!endTime) return { start, end: addMinutes(start, 60), timed: true };
  const nextDay = toMinutes(endTime) <= toMinutes(time);
  return { start, end: wall(nextDay ? addDays(date, 1) : date, endTime), timed: true };
}

function repeatDays(repeat: Exclude<Repeat, 'weekly' | 'monthly'>): Set<number> {
  if (repeat === 'daily') return new Set([1, 2, 3, 4, 5, 6, 7]);
  if (repeat === 'weekdays') return new Set([1, 2, 3, 4, 5]);
  if (repeat === 'weekends') return new Set([6, 7]);
  return new Set(repeat.map((d) => WEEKDAYS.indexOf(d) + 1));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Where the plan put a task, in its own terms: "Week 3 · Wed", "Weeks 2-5 · Mon, Thu", "Daily". */
export function timingLabel(r: TaskRange, repeat: Repeat | null): string {
  const parts: string[] = [];
  if (r.kind === 'index') {
    const name = cap(r.unit);
    parts.push(r.from === r.to ? `${name} ${r.from}` : `${name}s ${r.from}-${r.to}`);
    if (r.weekday !== null) parts.push(cap(WEEKDAYS[r.weekday - 1] as string));
  }
  if (repeat) parts.push(Array.isArray(repeat) ? repeat.map(cap).join(', ') : cap(repeat));
  return parts.join(' · ');
}

function itemUnit(r: TaskRange): Unit {
  if (r.kind === 'index') return r.weekday !== null ? 'day' : r.unit;
  return 'day';
}

/** Human length of a span, e.g. "2h", "3 days". */
export function spanLabel(start: WallTime, end: WallTime): string {
  const mins = minutesBetween(start, end);
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  const days = Math.round(mins / 1440);
  return `${days} day${days === 1 ? '' : 's'}`;
}

/** Whole days from a to b (b - a). */
export const daysBetween = (a: string, b: string): number => toDays(b) - toDays(a);

/** FNV-1a 32-bit: a stable fingerprint of the imported source (not security). */
export function hashText(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
