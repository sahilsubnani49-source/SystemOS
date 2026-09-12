import { TaskCategory, TaskCategorySummary, TaskSession } from '../models/TaskLog';

export interface ITaskLogRepository {
  /** Every category with its summed minutes, in sort order. */
  getCategories(): Promise<TaskCategorySummary[]>;
  /** Insert the defaults ONLY when the table is empty — a no-op on every later launch. */
  seedDefaultCategories(defaults: TaskCategory[]): Promise<void>;
  addCategory(category: TaskCategory): Promise<void>;
  /** Newest sessions first for one category. */
  getSessionsForCategory(categoryId: string, limit: number): Promise<TaskSession[]>;
  addSession(session: TaskSession): Promise<void>;
  /** Minutes already logged on a day across every category — drives the daily cap. */
  getMinutesForDate(dateStr: string): Promise<number>;
  /** Distinct days with at least one session, newest first — drives the streak. */
  getSessionDates(limit: number): Promise<string[]>;
  clearAll(): Promise<void>;
}
