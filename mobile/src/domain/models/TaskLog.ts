/**
 * Where a category's minutes come from, beyond its own hand-entered sessions.
 * `null` is a plain bucket. `'gym'` also absorbs Army-tab gym hours. `'focus'` is
 * synthetic — it has no `task_categories` row and exists only in the summary list.
 */
export type TaskCategorySource = 'gym' | 'focus' | null;

/**
 * A user-named bucket on the Hunter Log ("Coding", "Gym", "Studying"). Categories
 * are created by the Hunter; three defaults are seeded on first launch.
 */
export interface TaskCategory {
  id: string;
  name: string;
  /** A single emoji — the app has no icon font, and the tab bar already uses emoji. */
  icon: string;
  sortOrder: number;
  /** Link to another subsystem's time. See TaskCategorySource. */
  source: TaskCategorySource;
  createdAt: string;
}

/**
 * A category plus its total, computed on read. `totalMinutes` already includes any
 * time merged in from `source`, so callers never add the subsystems themselves.
 */
export interface TaskCategorySummary extends TaskCategory {
  totalMinutes: number;
  /**
   * The slice of `totalMinutes` that came from `source` rather than from this
   * category's own sessions. Lets a detail view explain why its total exceeds the
   * sessions it can list.
   */
  sourceMinutes: number;
  /**
   * True when this row has no `task_categories` record behind it (the Focus card).
   * Synthetic rows are read-only: there is nothing to log a hand-entered session against.
   */
  synthetic?: boolean;
}

/**
 * One self-reported chunk of time logged against a category. Unlike a TimeLog
 * (measured by the focus timer) this is entered by hand as hours + minutes, so it
 * is defended by a per-session ceiling and a daily cap rather than a clock.
 */
export interface TaskSession {
  id: string;
  categoryId: string;
  /** Local YYYY-MM-DD the session was logged on. */
  date: string;
  minutes: number;
  note: string;
  xpAwarded: number;
  createdAt: string;
}
