// Storage and plan-format types. A plan is a JSON file the user brings (written by any
// LLM, or by hand); Yotei validates it and computes every date itself, so the JSON only
// ever says WHEN relative to the plan ("week 3, wednesday") or on a calendar date.

/** 'hour' only appears on plans imported by Yotei's earlier Markdown importer. */
export type Unit = 'hour' | 'day' | 'week' | 'month' | 'year';

/** Local wall-clock time, "YYYY-MM-DDTHH:mm", in the user's current timezone. */
export type WallTime = string;

export interface Plan {
  id: string;
  title: string;
  /** The JSON exactly as imported (Markdown, for plans from the old importer). */
  source: string;
  sourceHash: string;
  /** IANA zone at import, for the record. "Now" always uses the device's CURRENT zone. */
  timezone: string;
  unit: Unit;
  start: WallTime;
  /** Exclusive. */
  end: WallTime;
  /** The plan's stated length, for display: "12 weeks", "until 2027-01-31". */
  limit: string;
  createdAt: string;
  archived: boolean;
}

export interface PlanItem {
  id: string;
  planId: string;
  text: string;
  /** Where the plan put it, relative to its start: "Week 3 · Wed", "Daily". */
  timing: string;
  notes: string | null;
  phase: string | null;
  unit: Unit;
  start: WallTime;
  /** Exclusive. */
  end: WallTime;
  /** Has explicit clock times (a slot), not just a calendar span. */
  timed: boolean;
  sort: number;
  doneAt: string | null;
}

/** A problem found in the JSON, with where it is ("tasks[3].week"). */
export interface Issue {
  path: string;
  message: string;
}
