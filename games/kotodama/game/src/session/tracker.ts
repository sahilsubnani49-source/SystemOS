import { isMastered, type SrsTable } from '@kotodama/core';
import type { StudySessionReport } from '../types';

/** Longest single answer that still counts as active study (a phone left on a prompt doesn't). */
const MAX_COUNTED_ANSWER_MS = 30_000;
const MINUTE_MS = 60_000;

export class SessionTracker {
  private startedAt = new Date();
  private activeMs = 0;
  private answered = 0;
  private correct = 0;
  private mastered = new Set<string>();

  recordAnswer(itemId: string, correct: boolean, elapsedMs: number, before: SrsTable, after: SrsTable) {
    this.answered += 1;
    if (correct) this.correct += 1;
    this.activeMs += Math.min(Math.max(0, elapsedMs), MAX_COUNTED_ANSWER_MS);
    if (!isMastered(before[itemId]) && isMastered(after[itemId])) this.mastered.add(itemId);
  }

  /**
   * A report is only worth sending once it holds a whole minute: hosts log whole
   * minutes and drop anything shorter. Below that, keep accumulating, so several
   * short sittings (the app is backgrounded between each) still add up.
   */
  get hasReportableTime(): boolean {
    return this.activeMs >= MINUTE_MS;
  }

  /** Report the whole minutes studied and start a fresh session; seconds left over carry forward. */
  flush(): StudySessionReport {
    const minutes = Math.floor(this.activeMs / MINUTE_MS);
    const report: StudySessionReport = {
      startedAt: this.startedAt.toISOString(),
      endedAt: new Date().toISOString(),
      activeMinutes: minutes,
      promptsAnswered: this.answered,
      correct: this.correct,
      itemsMastered: [...this.mastered],
    };
    this.startedAt = new Date();
    this.activeMs -= minutes * MINUTE_MS;
    this.answered = 0;
    this.correct = 0;
    this.mastered.clear();
    return report;
  }
}
