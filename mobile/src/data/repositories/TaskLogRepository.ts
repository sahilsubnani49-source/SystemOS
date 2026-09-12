import { getDb } from '../database/db';
import {
  TaskCategory,
  TaskCategorySource,
  TaskCategorySummary,
  TaskSession,
} from '../../domain/models/TaskLog';
import { ITaskLogRepository } from '../../domain/repositories/ITaskLogRepository';

function rowToCategory(row: Record<string, unknown>): TaskCategorySummary {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: (row.icon as string) ?? '⏱️',
    sortOrder: (row.sort_order as number) ?? 0,
    source: ((row.source as string) ?? null) as TaskCategorySource,
    createdAt: row.created_at as string,
    totalMinutes: (row.total_minutes as number) ?? 0,
    // Stored rows only know their own sessions; the store folds in any source time.
    sourceMinutes: 0,
  };
}

function rowToSession(row: Record<string, unknown>): TaskSession {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    date: row.date as string,
    minutes: (row.minutes as number) ?? 0,
    note: (row.note as string) ?? '',
    xpAwarded: (row.xp_awarded as number) ?? 0,
    createdAt: row.created_at as string,
  };
}

export class TaskLogRepository implements ITaskLogRepository {
  async getCategories(): Promise<TaskCategorySummary[]> {
    const db = await getDb();
    // LEFT JOIN so a brand-new category with no sessions still appears (total 0).
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT c.*, COALESCE(SUM(s.minutes), 0) AS total_minutes
         FROM task_categories c
         LEFT JOIN task_sessions s ON s.category_id = c.id
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.created_at ASC`,
    );
    return rows.map(rowToCategory);
  }

  async seedDefaultCategories(defaults: TaskCategory[]): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const existing = await db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM task_categories',
      );
      if ((existing?.n ?? 0) > 0) return;
      for (const c of defaults) {
        await db.runAsync(
          'INSERT INTO task_categories (id, name, icon, sort_order, source, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.icon, c.sortOrder, c.source, c.createdAt],
        );
      }
    });
  }

  async addCategory(category: TaskCategory): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO task_categories (id, name, icon, sort_order, source, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        category.id,
        category.name,
        category.icon,
        category.sortOrder,
        category.source,
        category.createdAt,
      ],
    );
  }

  async getSessionsForCategory(categoryId: string, limit: number): Promise<TaskSession[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM task_sessions
        WHERE category_id = ?
        ORDER BY created_at DESC LIMIT ?`,
      [categoryId, limit],
    );
    return rows.map(rowToSession);
  }

  async addSession(session: TaskSession): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO task_sessions (id, category_id, date, minutes, note, xp_awarded, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.categoryId,
        session.date,
        session.minutes,
        session.note,
        session.xpAwarded,
        session.createdAt,
      ],
    );
  }

  async getMinutesForDate(dateStr: string): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ m: number }>(
      'SELECT COALESCE(SUM(minutes), 0) AS m FROM task_sessions WHERE date = ?',
      [dateStr],
    );
    return row?.m ?? 0;
  }

  async getSessionDates(limit: number): Promise<string[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ date: string }>(
      'SELECT DISTINCT date FROM task_sessions ORDER BY date DESC LIMIT ?',
      [limit],
    );
    return rows.map((r) => r.date);
  }

  async clearAll(): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM task_sessions');
      await db.runAsync('DELETE FROM task_categories');
    });
  }
}
