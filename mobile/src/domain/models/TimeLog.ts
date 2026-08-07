/**
 * Where a log's description came from. Three states rather than an "isAiGenerated"
 * boolean because the on-device template and the Architect are genuinely different
 * provenances, and history badges them differently.
 */
export type DescriptionSource = 'manual' | 'campaign' | 'ai';

/**
 * One timed work session in the Army tab's focus log.
 *
 * A row with `endedAt === null` IS the running timer — there is at most one at a
 * time. Elapsed seconds are always derived from `startedAt` (see `useElapsedSeconds`),
 * never stored or ticked, so a session survives app kill, backgrounding, and
 * re-renders without any bookkeeping.
 */
export interface TimeLog {
  id: string;
  /** Local YYYY-MM-DD, fixed from `startedAt` at insert and never rewritten. */
  date: string;
  description: string;
  descriptionSource: DescriptionSource;
  /** Tagged campaign (a Goal), or null when untagged. No FK — see detachGoal. */
  goalId: string | null;
  /** The quest the description was drawn from. Provenance only; nothing writes back. */
  questId: string | null;
  startedAt: string;
  /** null ⇒ still running. */
  endedAt: string | null;
  /** Raw measured elapsed — the honest number shown in history. 0 while running. */
  seconds: number;
  /** Elapsed after the session + daily clamps; what XP was actually paid on. */
  creditedSeconds: number;
  xpAwarded: number;
  createdAt: string;
}
