// Wire + storage types. The planner the user provides is the ONLY source of truth:
// every task's text is a verbatim quote from it, and every date is computed here
// from what the planner states, never by the LLM.

export type Unit = 'hour' | 'day' | 'week' | 'month' | 'year';
export const UNITS: readonly Unit[] = ['hour', 'day', 'week', 'month', 'year'];

/** When an item happens, exactly as the planner states it (relative or absolute). */
export interface DraftPeriod {
  unit: Unit;
  /** Relative position, 1-based: "Week 3" → 3, "Day 12" → 12, "Hour 2" → 2. */
  index?: number | null;
  /** 1 = Monday … 7 = Sunday, inside a relative week ("Week 2, Wednesday"). */
  weekday?: number | null;
  /** Absolute dates written in the planner, YYYY-MM-DD. */
  date?: string | null;
  endDate?: string | null;
  /** 24h HH:mm clock times written in the planner. */
  timeStart?: string | null;
  timeEnd?: string | null;
}

export interface DraftItem {
  /** Verbatim text from the planner. This is what Yotei shows: nothing reworded. */
  quote: string;
  /** Verbatim text from the planner that says WHEN ("Week 3", "Mon 09:00-11:00"). */
  periodQuote: string;
  period: DraftPeriod;
}

export interface Rejection {
  quote: string;
  reason: string;
}

/** What the backend returns after the LLM structured the planner and code verified it. */
export interface PlanDraft {
  title: string;
  /** Verbatim text stating the plan's time limit ("12-week plan", "by 2026-12-31"). */
  boundaryQuote: string;
  /** Relative length ("12 weeks"), when the planner states one. */
  horizon: { unit: Unit; length: number } | null;
  /** Absolute bounds, when the planner states them. */
  startDate: string | null;
  endDate: string | null;
  items: DraftItem[];
  /** Items dropped because their text isn't in the planner. */
  rejected: Rejection[];
  /** Items whose timing isn't written in the planner: never given an invented date. */
  unscheduled: Rejection[];
  /** Task-like planner lines that no item covers. */
  unassignedLines: string[];
}

/** Local wall-clock time, "YYYY-MM-DDTHH:mm", in the user's current timezone. */
export type WallTime = string;

export interface Plan {
  id: string;
  title: string;
  sourceMd: string;
  sourceHash: string;
  /** IANA zone at import, for the record. "Now" always uses the device's CURRENT zone. */
  timezone: string;
  unit: Unit;
  start: WallTime;
  /** Exclusive. */
  end: WallTime;
  boundaryQuote: string;
  createdAt: string;
  archived: boolean;
}

export interface PlanItem {
  id: string;
  planId: string;
  text: string;
  periodQuote: string;
  unit: Unit;
  start: WallTime;
  /** Exclusive. */
  end: WallTime;
  /** Has explicit clock times (an hour slot), not just a calendar span. */
  timed: boolean;
  sort: number;
  doneAt: string | null;
}
