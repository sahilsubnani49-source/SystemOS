import { getDb } from '../database/db';
import { DescriptionSource, TimeLog } from '../../domain/models/TimeLog';
import { ITimeLogRepository } from '../../domain/repositories/ITimeLogRepository';

const INSERT_COLUMNS = `(id, date, description, description_source, goal_id, quest_id,
   started_at, ended_at, seconds, credited_seconds, xp_awarded, created_at)`;

function rowToTimeLog(row: Record<string, unknown>): TimeLog {
  return {
    id: row.id as string,
    date: row.date as string,
    description: (row.description as string) ?? '',
    descriptionSource: ((row.description_source as string) ?? 'manual') as DescriptionSource,
    goalId: (row.goal_id as string | null) ?? null,
    questId: (row.quest_id as string | null) ?? null,
    startedAt: row.started_at as string,
    endedAt: (row.ended_at as string | null) ?? null,
    seconds: (row.seconds as number) ?? 0,
    creditedSeconds: (row.credited_seconds as number) ?? 0,
    xpAwarded: (row.xp_awarded as number) ?? 0,
    createdAt: row.created_at as string,
  };
}

export class TimeLogRepository implements ITimeLogRepository {
  async getRunningLog(): Promise<TimeLog | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM time_logs WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
    );
    return row ? rowToTimeLog(row) : null;
  }

  async startLog(log: TimeLog): Promise<void> {
    // The re-check lives INSIDE the transaction: it is the last line of defence for
    // the one-running-timer invariant, after the store's `running` and `starting` guards.
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const existing = await db.getFirstAsync<Record<string, unknown>>(
        'SELECT id FROM time_logs WHERE ended_at IS NULL LIMIT 1',
      );
      if (existing) throw new Error('A timer is already running.');

      await db.runAsync(
        `INSERT INTO time_logs ${INSERT_COLUMNS}
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, 0, 0, ?)`,
        [
          log.id,
          log.date,
          log.description,
          log.descriptionSource,
          log.goalId ?? null,
          log.questId ?? null,
          log.startedAt,
          log.createdAt,
        ],
      );
    });
  }

  async finishLog(
    id: string,
    endedAt: string,
    seconds: number,
    creditedSeconds: number,
    xpAwarded: number,
  ): Promise<TimeLog> {
    const db = await getDb();
    // `AND ended_at IS NULL` makes stop idempotent — a double-tap matches zero rows
    // the second time instead of overwriting XP that was already banked.
    await db.runAsync(
      `UPDATE time_logs
          SET ended_at = ?, seconds = ?, credited_seconds = ?, xp_awarded = ?
        WHERE id = ? AND ended_at IS NULL`,
      [endedAt, seconds, creditedSeconds, xpAwarded, id],
    );
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM time_logs WHERE id = ?',
      [id],
    );
    if (!row) throw new Error(`TimeLog ${id} not found`);
    return rowToTimeLog(row);
  }

  async updateDescription(
    id: string,
    description: string,
    source: DescriptionSource,
  ): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE time_logs SET description = ?, description_source = ? WHERE id = ?', [
      description,
      source,
      id,
    ]);
  }

  async deleteLog(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM time_logs WHERE id = ?', [id]);
  }

  async getLogsForDate(dateStr: string): Promise<TimeLog[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM time_logs
        WHERE date = ? AND ended_at IS NOT NULL
        ORDER BY started_at DESC`,
      [dateStr],
    );
    return rows.map(rowToTimeLog);
  }

  async getRecentLogs(limit: number): Promise<TimeLog[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM time_logs
        WHERE ended_at IS NOT NULL
        ORDER BY started_at DESC LIMIT ?`,
      [limit],
    );
    return rows.map(rowToTimeLog);
  }

  async getCreditedSecondsForDate(dateStr: string): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT COALESCE(SUM(credited_seconds), 0) AS s
         FROM time_logs WHERE date = ? AND ended_at IS NOT NULL`,
      [dateStr],
    );
    return (row?.s as number) ?? 0;
  }

  async getTotalMinutes(): Promise<number> {
    // Raw `seconds`, not `credited_seconds`: the Hunter Log shows time actually spent,
    // the same way a hand-entered session shows the honest number the Hunter typed.
    // A running session (ended_at IS NULL) has seconds = 0 and is excluded anyway.
    const db = await getDb();
    const row = await db.getFirstAsync<{ m: number }>(
      `SELECT COALESCE(SUM(seconds), 0) / 60.0 AS m
         FROM time_logs WHERE ended_at IS NOT NULL`,
    );
    return Math.round(row?.m ?? 0);
  }

  async detachGoal(goalId: string): Promise<void> {
    // The description was denormalized at start, so history stays readable — only
    // the campaign link and its chip disappear. Awarded XP is untouched; it was earned.
    const db = await getDb();
    await db.runAsync('UPDATE time_logs SET goal_id = NULL, quest_id = NULL WHERE goal_id = ?', [
      goalId,
    ]);
  }

  async clearAll(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM time_logs');
  }
}
