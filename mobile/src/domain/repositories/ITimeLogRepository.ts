import { DescriptionSource, TimeLog } from '../models/TimeLog';

export interface ITimeLogRepository {
  /** The single in-flight log (ended_at IS NULL), or null when no timer is running. */
  getRunningLog(): Promise<TimeLog | null>;
  /** Insert a running log. Throws if a timer is already running (checked in-transaction). */
  startLog(log: TimeLog): Promise<void>;
  /** Close a running log and stamp its measured/credited seconds + XP. Idempotent. */
  finishLog(
    id: string,
    endedAt: string,
    seconds: number,
    creditedSeconds: number,
    xpAwarded: number,
  ): Promise<TimeLog>;
  /** Amend a log's description — used by the stop sheet and the AI upgrade. */
  updateDescription(id: string, description: string, source: DescriptionSource): Promise<void>;
  /** Throw a log away entirely (cancelled, or under the minimum duration). */
  deleteLog(id: string): Promise<void>;
  /** Finished logs for a calendar day, newest first. Never includes the running one. */
  getLogsForDate(dateStr: string): Promise<TimeLog[]>;
  /** Most recent finished logs across all days. */
  getRecentLogs(limit: number): Promise<TimeLog[]>;
  /** Credited seconds already banked on a day — drives the daily cap. */
  getCreditedSecondsForDate(dateStr: string): Promise<number>;
  /** Sever the campaign link on every log referencing a goal (abandon/delete). */
  detachGoal(goalId: string): Promise<void>;
  clearAll(): Promise<void>;
}
