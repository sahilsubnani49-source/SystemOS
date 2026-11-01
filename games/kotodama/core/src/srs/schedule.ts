// Spaced repetition: a Leitner box per item, stages 0..MAX_STAGE.
// Right answer → move up a stage and wait longer before it is due again.
// Wrong answer → drop two stages and become due immediately.
//
// Battles are the review sessions: encounters pull due items, so the game
// decides WHAT you fight from what you are about to forget.

export const MAX_STAGE = 5;

/** Wait before an item is due again, indexed by the stage it has just reached. */
export const STAGE_INTERVAL_MS: readonly number[] = [
  0, //                        stage 0: new / just failed: due now
  10 * 60_000, //              stage 1: 10 minutes (again later this session)
  8 * 3_600_000, //            stage 2: 8 hours
  24 * 3_600_000, //           stage 3: 1 day
  3 * 24 * 3_600_000, //       stage 4: 3 days
  7 * 24 * 3_600_000, //       stage 5: a week (mastered)
];

export interface SrsItem {
  id: string;
  stage: number;
  /** Epoch ms when the item is next due. */
  dueAt: number;
  reps: number;
  lapses: number;
  /** Epoch ms of the last answer, or 0 if never seen. */
  lastSeenAt: number;
}

export type SrsTable = Record<string, SrsItem>;

export function newItem(id: string, now: number): SrsItem {
  return { id, stage: 0, dueAt: now, reps: 0, lapses: 0, lastSeenAt: 0 };
}

/** Pure: the item after one answer. */
export function review(item: SrsItem, correct: boolean, now: number): SrsItem {
  if (correct) {
    const stage = Math.min(MAX_STAGE, item.stage + 1);
    return {
      ...item,
      stage,
      dueAt: now + (STAGE_INTERVAL_MS[stage] ?? 0),
      reps: item.reps + 1,
      lastSeenAt: now,
    };
  }
  return {
    ...item,
    stage: Math.max(0, item.stage - 2),
    dueAt: now,
    reps: item.reps + 1,
    lapses: item.lapses + 1,
    lastSeenAt: now,
  };
}

export function isDue(item: SrsItem, now: number): boolean {
  return item.dueAt <= now;
}

export function isMastered(item: SrsItem | undefined): boolean {
  return (item?.stage ?? 0) >= MAX_STAGE;
}

/** Record an answer in a table, creating the item on first sight. Returns a new table. */
export function recordAnswer(table: SrsTable, id: string, correct: boolean, now: number): SrsTable {
  const item = table[id] ?? newItem(id, now);
  return { ...table, [id]: review(item, correct, now) };
}

/** Mean stage (0..MAX_STAGE) over `ids`; unseen ids count as 0. */
export function averageStage(table: SrsTable, ids: readonly string[]): number {
  if (ids.length === 0) return 0;
  return ids.reduce((sum, id) => sum + (table[id]?.stage ?? 0), 0) / ids.length;
}
