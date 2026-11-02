import { addDays, addMonths, wall } from './dates';
import type { PlanItem, WallTime } from './types';

// "What do I have to do?" at three zoom levels: today, the next 7 days, the next 12 months.
// Computed at read time from stored items and the user's current wall-clock time, so the
// views roll forward by themselves. Nothing is rescheduled: a missed item stays missed.

export interface DayAgenda {
  date: string;
  /** Clock slots touching that day, by start time. */
  timed: PlanItem[];
  /** Untimed tasks for exactly that day. */
  tasks: PlanItem[];
  /** Multi-day tasks running that day ("week 3", "month 2"), ending soonest first. */
  ongoing: PlanItem[];
}

const byStart = (a: PlanItem, b: PlanItem) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.sort - b.sort);
const byEnd = (a: PlanItem, b: PlanItem) => (a.end < b.end ? -1 : a.end > b.end ? 1 : a.sort - b.sort);
const overlaps = (it: PlanItem, start: WallTime, end: WallTime) => it.start < end && it.end > start;

export function dayAgenda(items: PlanItem[], date: string): DayAgenda {
  const ds = wall(date);
  const de = wall(addDays(date, 1));
  const today = items.filter((it) => overlaps(it, ds, de));
  return {
    date,
    timed: today.filter((it) => it.timed).sort(byStart),
    tasks: today.filter((it) => !it.timed && it.start === ds && it.end === de).sort(byStart),
    ongoing: today.filter((it) => !it.timed && !(it.start === ds && it.end === de)).sort(byEnd),
  };
}

export interface WeekAgenda {
  /** Seven days from `today`; each day's `ongoing` is empty (it is listed once, below). */
  days: DayAgenda[];
  /** Multi-day tasks running at any point in these seven days. */
  ongoing: PlanItem[];
}

export function weekAgenda(items: PlanItem[], today: string): WeekAgenda {
  const days = Array.from({ length: 7 }, (_, i) => ({ ...dayAgenda(items, addDays(today, i)), ongoing: [] }));
  const ongoing = items
    .filter((it) => !it.timed && it.end > addOneDay(it.start) && overlaps(it, wall(today), wall(addDays(today, 7))))
    .sort(byEnd);
  return { days, ongoing };
}

const addOneDay = (w: WallTime): WallTime => `${addDays(w.slice(0, 10), 1)}${w.slice(10)}`;

/** One task across its occurrences in a span: "Review flashcards ×30". */
export interface TaskGroup {
  planId: string;
  text: string;
  phase: string | null;
  count: number;
  done: number;
  first: PlanItem;
  last: PlanItem;
}

function group(items: PlanItem[]): TaskGroup[] {
  const map = new Map<string, TaskGroup>();
  for (const it of [...items].sort(byStart)) {
    const key = `${it.planId}\u0000${it.text}`;
    const g = map.get(key);
    if (g) {
      g.count++;
      if (it.doneAt) g.done++;
      g.last = it;
    } else {
      map.set(key, { planId: it.planId, text: it.text, phase: it.phase, count: 1, done: it.doneAt ? 1 : 0, first: it, last: it });
    }
  }
  return [...map.values()];
}

export interface MonthAgenda {
  /** YYYY-MM */
  month: string;
  total: number;
  done: number;
  /** Phase names active this month, in order. */
  phases: string[];
  groups: TaskGroup[];
}

/** Twelve calendar months starting with the one `today` is in. */
export function yearAgenda(items: PlanItem[], today: string): MonthAgenda[] {
  const first = `${today.slice(0, 7)}-01`;
  return Array.from({ length: 12 }, (_, i) => {
    const ms = addMonths(first, i);
    const inMonth = items.filter((it) => overlaps(it, wall(ms), wall(addMonths(first, i + 1))));
    const phases = [...new Set(inMonth.slice().sort(byStart).map((it) => it.phase).filter((p): p is string => !!p))];
    return {
      month: ms.slice(0, 7),
      total: inMonth.length,
      done: inMonth.filter((it) => it.doneAt !== null).length,
      phases,
      groups: group(inMonth),
    };
  });
}

/** Ended and not done, grouped so a missed daily habit is one line. Most recent first. */
export function missed(items: PlanItem[], now: WallTime): TaskGroup[] {
  return group(items.filter((it) => it.end <= now && it.doneAt === null)).sort((a, b) =>
    a.last.end > b.last.end ? -1 : a.last.end < b.last.end ? 1 : 0,
  );
}

export function progress(items: PlanItem[]): { done: number; total: number } {
  return { done: items.filter((i) => i.doneAt !== null).length, total: items.length };
}

/** The one thing the Today screen puts on top. */
export interface Focus {
  item: PlanItem;
  /** 'now': its slot is running. 'next': the next slot today. 'todo': an untimed task to get on with. */
  kind: 'now' | 'next' | 'todo';
}

/**
 * Pick the "Right now" card from today's agenda.
 * `day.timed` is sorted by start; `day.tasks` and `day.ongoing` hold untimed work.
 * An item is done when `doneAt !== null`; a slot is running when `start <= now < end`.
 */
export function pickFocus(day: DayAgenda, now: WallTime): Focus | null {
  // TODO(human)
  return null;
}
