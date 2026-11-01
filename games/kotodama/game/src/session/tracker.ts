import { isMastered, type SrsTable } from '@kotodama/core';
import type { StudySessionReport } from '../types';

/** Longest single answer that still counts as active study (a phone left on a prompt doesn't). */
const MAX_COUNTED_ANSWER_MS = 30_000;

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

  get hasActivity(): boolean {
    return this.answered > 0;
  }

  /** Build the report and start a fresh session. */
  flush(): StudySessionReport {
    const report: StudySessionReport = {
      startedAt: this.startedAt.toISOString(),
      endedAt: new Date().toISOString(),
      activeMinutes: Math.round(this.activeMs / 60_000),
      promptsAnswered: this.answered,
      correct: this.correct,
      itemsMastered: [...this.mastered],
    };
    this.startedAt = new Date();
    this.activeMs = 0;
    this.answered = 0;
    this.correct = 0;
    this.mastered.clear();
    return report;
  }
}
