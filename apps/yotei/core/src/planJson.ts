import { isValidDate, isValidTime } from './dates';
import type { Issue } from './types';

// The Yotei plan format (version 1): parse and validate the JSON a user pastes. Pure: no
// dates are computed here (resolve.ts does that). Problems are reported with their path
// so the user can fix the JSON or ask the LLM to; nothing is guessed or auto-corrected.
//
// Plan-level problems block the import. A broken task is skipped and listed, so one bad
// line in a 200-task plan doesn't throw the rest away.

export const FORMAT_VERSION = 1;

export type IndexUnit = 'day' | 'week' | 'month' | 'year';
export const INDEX_UNITS: readonly IndexUnit[] = ['day', 'week', 'month', 'year'];

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekdayName = (typeof WEEKDAYS)[number];

/** Expands into one item per matching day (daily…list) or per plan week/month (weekly, monthly). */
export type Repeat = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly' | WeekdayName[];

export type TaskRange =
  /** Calendar dates; `end` is inclusive. */
  | { kind: 'date'; start: string; end: string }
  /** Counted from the plan start, 1-based and inclusive: week [2, 4] = weeks 2 to 4. */
  | { kind: 'index'; unit: IndexUnit; from: number; to: number; weekday: number | null }
  /** No range given: the task repeats across the whole plan. */
  | { kind: 'plan' };

export interface TaskSpec {
  /** Where it was in the JSON, for messages: "tasks[3]". */
  path: string;
  task: string;
  notes: string | null;
  phase: string | null;
  range: TaskRange;
  time: string | null;
  endTime: string | null;
  repeat: Repeat | null;
}

export interface PlanSpec {
  title: string;
  /** YYYY-MM-DD, or null: the user picks the start at import. */
  start: string | null;
  /** Inclusive last day. Exactly one of `end` / `duration` is set. */
  end: string | null;
  duration: { unit: IndexUnit; count: number } | null;
  tasks: TaskSpec[];
}

export interface ParseResult {
  /** Null when the plan itself can't be used; `errors` says why. */
  spec: PlanSpec | null;
  errors: Issue[];
  /** Tasks left out, each with the reason. */
  skipped: Issue[];
  /** Fields Yotei doesn't know, ignored. */
  warnings: Issue[];
}

export const LIMITS = { chars: 500_000, tasks: 3000, title: 120, task: 300, notes: 2000, phase: 80 } as const;

const PLAN_KEYS = new Set(['yotei', 'title', 'start', 'end', 'duration', 'tasks']);
const TASK_KEYS = new Set([
  'task', 'notes', 'phase', 'date', 'end_date', 'day', 'week', 'month', 'year', 'weekday', 'time', 'end_time', 'repeat',
]);
const REPEATS = new Set(['daily', 'weekdays', 'weekends', 'weekly', 'monthly']);

/**
 * LLMs often wrap the JSON in a ```json fence or a sentence of prose. Take the outermost
 * {...} so the user can paste the whole reply.
 */
export function extractJson(text: string): string {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  return first >= 0 && last > first ? text.slice(first, last + 1) : text.trim();
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** 1 = Monday … 7 = Sunday. Accepts "wed", "Wednesday", "WED". */
export function weekdayNumber(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  const i = WEEKDAYS.indexOf(v.trim().slice(0, 3).toLowerCase() as WeekdayName);
  return i >= 0 ? i + 1 : null;
}

export function parsePlanJson(text: string): ParseResult {
  const errors: Issue[] = [];
  const skipped: Issue[] = [];
  const unknown = new Map<string, number>();
  const result = (spec: PlanSpec | null): ParseResult => ({
    spec,
    errors,
    skipped,
    warnings: [...unknown].map(([path, n]) => ({
      path,
      message: n > 1 ? `Unknown field, ignored (in ${n} places)` : 'Unknown field, ignored',
    })),
  });

  if (!text.trim()) return result(null);
  if (text.length > LIMITS.chars) {
    errors.push({ path: '', message: `Too long (${text.length.toLocaleString()} characters; the limit is ${LIMITS.chars.toLocaleString()}).` });
    return result(null);
  }

  let root: unknown;
  try {
    root = JSON.parse(extractJson(text));
  } catch (e) {
    errors.push({ path: '', message: `Not valid JSON: ${e instanceof Error ? e.message : String(e)}` });
    return result(null);
  }
  if (!isObj(root)) {
    errors.push({ path: '', message: 'The plan must be one JSON object: { "title": …, "tasks": [ … ] }' });
    return result(null);
  }
  for (const k of Object.keys(root)) if (!PLAN_KEYS.has(k)) unknown.set(k, 1);

  if (root.yotei !== undefined && root.yotei !== FORMAT_VERSION) {
    errors.push({ path: 'yotei', message: `This app reads format version ${FORMAT_VERSION}; the plan says ${JSON.stringify(root.yotei)}.` });
  }

  const title = str(root.title);
  if (!title) errors.push({ path: 'title', message: 'Missing: give the plan a short name.' });
  else if (title.length > LIMITS.title) errors.push({ path: 'title', message: `Longer than ${LIMITS.title} characters.` });

  let start: string | null = null;
  if (root.start !== undefined && root.start !== null) {
    if (isValidDate(root.start as string)) start = root.start as string;
    else errors.push({ path: 'start', message: 'Must be a real date written YYYY-MM-DD.' });
  }

  // The time limit: exactly one of end / duration. Yotei never invents one.
  let end: string | null = null;
  let duration: PlanSpec['duration'] = null;
  const hasEnd = root.end !== undefined && root.end !== null;
  const hasDuration = root.duration !== undefined && root.duration !== null;
  if (hasEnd && hasDuration) {
    errors.push({ path: 'end', message: 'Give either "end" or "duration", not both.' });
  } else if (hasEnd) {
    if (!isValidDate(root.end as string)) errors.push({ path: 'end', message: 'Must be a real date written YYYY-MM-DD.' });
    else if (start && (root.end as string) < start) errors.push({ path: 'end', message: 'Is before "start".' });
    else end = root.end as string;
  } else if (hasDuration) {
    duration = parseDuration(root.duration);
    if (!duration) {
      errors.push({ path: 'duration', message: 'Must be one of {"days": n}, {"weeks": n}, {"months": n} or {"years": n}.' });
    }
  } else {
    errors.push({ path: 'duration', message: 'Missing: the plan needs a time limit, "duration" (e.g. {"weeks": 12}) or "end" (YYYY-MM-DD).' });
  }

  const tasks: TaskSpec[] = [];
  if (!Array.isArray(root.tasks)) {
    errors.push({ path: 'tasks', message: 'Missing: "tasks" must be a list.' });
  } else if (root.tasks.length > LIMITS.tasks) {
    errors.push({ path: 'tasks', message: `More than ${LIMITS.tasks} tasks. Use "repeat" for tasks that recur.` });
  } else {
    root.tasks.forEach((raw, i) => {
      const parsed = parseTask(raw, `tasks[${i}]`, unknown);
      if ('problem' in parsed) skipped.push({ path: `tasks[${i}]`, message: parsed.problem });
      else tasks.push(parsed);
    });
    if (root.tasks.length > 0 && tasks.length === 0) {
      errors.push({ path: 'tasks', message: 'None of the tasks can be used (see below).' });
    } else if (root.tasks.length === 0) {
      errors.push({ path: 'tasks', message: 'The list is empty.' });
    }
  }

  if (errors.length > 0 || !title) return result(null);
  return result({ title, start, end, duration, tasks });
}

function parseDuration(v: unknown): PlanSpec['duration'] {
  if (!isObj(v)) return null;
  const keys = Object.keys(v);
  if (keys.length !== 1) return null;
  const unit = ({ days: 'day', weeks: 'week', months: 'month', years: 'year' } as const)[keys[0] as string];
  const count = v[keys[0] as string];
  return unit && isPosInt(count) ? { unit, count } : null;
}

/** A positive whole number, or a [from, to] range of them. */
function parseIndex(v: unknown): { from: number; to: number } | null {
  if (isPosInt(v)) return { from: v, to: v };
  if (Array.isArray(v) && v.length === 2 && isPosInt(v[0]) && isPosInt(v[1]) && v[0] <= v[1]) return { from: v[0], to: v[1] };
  return null;
}

function parseRepeat(v: unknown): Repeat | null {
  if (typeof v === 'string' && REPEATS.has(v.trim().toLowerCase())) return v.trim().toLowerCase() as Repeat;
  if (Array.isArray(v) && v.length > 0) {
    const days = v.map(weekdayNumber);
    if (days.some((d) => d === null)) return null;
    return [...new Set(days as number[])].sort().map((d) => WEEKDAYS[d - 1] as WeekdayName);
  }
  return null;
}

function parseTask(raw: unknown, path: string, unknown: Map<string, number>): TaskSpec | { problem: string } {
  if (!isObj(raw)) return { problem: 'Each task must be an object like { "task": "…", "week": 1 }.' };
  for (const k of Object.keys(raw)) if (!TASK_KEYS.has(k)) unknown.set(`tasks[].${k}`, (unknown.get(`tasks[].${k}`) ?? 0) + 1);

  const task = str(raw.task);
  if (!task) return { problem: 'Missing "task": what to do.' };
  if (task.length > LIMITS.task) return { problem: `"task" is longer than ${LIMITS.task} characters; put details in "notes".` };
  const label = `"${task.length > 40 ? `${task.slice(0, 40)}…` : task}"`;

  const notes = raw.notes == null ? null : str(raw.notes);
  if (raw.notes != null && typeof raw.notes !== 'string') return { problem: `${label}: "notes" must be text.` };
  if (notes && notes.length > LIMITS.notes) return { problem: `${label}: "notes" is longer than ${LIMITS.notes} characters.` };
  const phase = raw.phase == null ? null : str(raw.phase);
  if (raw.phase != null && typeof raw.phase !== 'string') return { problem: `${label}: "phase" must be text.` };
  if (phase && phase.length > LIMITS.phase) return { problem: `${label}: "phase" is longer than ${LIMITS.phase} characters.` };

  // Timing: at most one range key.
  const rangeKeys = (['date', ...INDEX_UNITS] as const).filter((k) => raw[k] !== undefined && raw[k] !== null);
  if (rangeKeys.length > 1) return { problem: `${label}: use only one of ${rangeKeys.map((k) => `"${k}"`).join(', ')}.` };

  let repeat: Repeat | null = null;
  if (raw.repeat != null) {
    repeat = parseRepeat(raw.repeat);
    if (!repeat) {
      return { problem: `${label}: "repeat" must be "daily", "weekdays", "weekends", "weekly", "monthly" or a list like ["mon", "thu"].` };
    }
  }

  let range: TaskRange;
  const key = rangeKeys[0];
  if (key === 'date') {
    if (!isValidDate(raw.date as string)) return { problem: `${label}: "date" must be a real date written YYYY-MM-DD.` };
    const endDate = raw.end_date == null ? (raw.date as string) : (raw.end_date as string);
    if (!isValidDate(endDate) || endDate < (raw.date as string)) {
      return { problem: `${label}: "end_date" must be a YYYY-MM-DD date on or after "date".` };
    }
    range = { kind: 'date', start: raw.date as string, end: endDate };
  } else if (key) {
    const idx = parseIndex(raw[key]);
    if (!idx) return { problem: `${label}: "${key}" must be a number from 1 (the first ${key}), or a range like [2, 4].` };
    range = { kind: 'index', unit: key, from: idx.from, to: idx.to, weekday: null };
  } else if (repeat) {
    range = { kind: 'plan' };
  } else {
    return { problem: `${label}: no timing. Add "date", "day", "week", "month" or "year", or a "repeat".` };
  }
  if (raw.end_date != null && key !== 'date') return { problem: `${label}: "end_date" only goes with "date".` };

  if (raw.weekday != null) {
    const wd = weekdayNumber(raw.weekday);
    if (!wd) return { problem: `${label}: "weekday" must be "mon", "tue", "wed", "thu", "fri", "sat" or "sun".` };
    if (range.kind !== 'index' || range.unit !== 'week' || range.from !== range.to) {
      return { problem: `${label}: "weekday" needs a single "week". For a weekday in every week, use "repeat": ["${WEEKDAYS[wd - 1]}"].` };
    }
    if (repeat) return { problem: `${label}: use "weekday" or "repeat", not both.` };
    range.weekday = wd;
  }

  // Clock times need a specific day to sit on.
  const time = raw.time == null ? null : (raw.time as string);
  const endTime = raw.end_time == null ? null : (raw.end_time as string);
  if (time !== null && !isValidTime(time)) return { problem: `${label}: "time" must be 24-hour "HH:MM", like "07:30".` };
  if (endTime !== null && !isValidTime(endTime)) return { problem: `${label}: "end_time" must be 24-hour "HH:MM".` };
  if (endTime !== null && time === null) return { problem: `${label}: "end_time" needs a "time".` };
  if (time !== null && !hasSingleDays(range, repeat)) {
    return {
      problem: `${label}: "time" needs a specific day: a "date", "day", a "week" with "weekday", or a daily/weekday "repeat".`,
    };
  }

  return { path, task, notes, phase, range, time, endTime, repeat };
}

/** True when the task lands on individual days (so a clock time makes sense). */
function hasSingleDays(range: TaskRange, repeat: Repeat | null): boolean {
  if (repeat) return repeat !== 'weekly' && repeat !== 'monthly';
  if (range.kind === 'date') return range.start === range.end;
  if (range.kind === 'index') return (range.unit === 'day' && range.from === range.to) || range.weekday !== null;
  return false;
}
