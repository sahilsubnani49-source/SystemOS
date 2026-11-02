import { getDb } from '../database/db';
import type {
  DiagnosticCategory,
  DiagnosticEvent,
  DiagnosticLevel,
} from '../../domain/models/DiagnosticEvent';

interface DiagnosticRow {
  id: number;
  at: string;
  level: string;
  category: string;
  message: string;
  data: string | null;
}

function rowToEvent(row: DiagnosticRow): DiagnosticEvent {
  let data: Record<string, unknown> | undefined;
  if (row.data) {
    try {
      data = JSON.parse(row.data) as Record<string, unknown>;
    } catch {
      data = undefined;
    }
  }
  return {
    id: row.id,
    at: row.at,
    level: row.level as DiagnosticLevel,
    category: row.category as DiagnosticCategory,
    message: row.message,
    data,
  };
}

const LEVELS_AT_LEAST: Record<DiagnosticLevel, DiagnosticLevel[]> = {
  debug: ['debug', 'info', 'warn', 'error'],
  info: ['info', 'warn', 'error'],
  warn: ['warn', 'error'],
  error: ['error'],
};

export class DiagnosticsRepository {
  /**
   * One multi-row INSERT per flush. A single statement is atomic on its own, so this
   * avoids an explicit transaction on the shared connection, which would also sweep
   * up any other store's queries that happened to run while it was open.
   */
  async insertMany(events: DiagnosticEvent[]): Promise<void> {
    if (events.length === 0) return;
    const db = await getDb();
    const placeholders = events.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const params = events.flatMap((e) => [
      e.at,
      e.level,
      e.category,
      e.message,
      e.data ? JSON.stringify(e.data) : null,
    ]);
    await db.runAsync(
      `INSERT INTO diagnostic_logs (at, level, category, message, data) VALUES ${placeholders}`,
      params,
    );
  }

  /** Newest first. `minLevel` keeps that level and everything more severe. */
  async list(opts: { minLevel?: DiagnosticLevel; limit: number }): Promise<DiagnosticEvent[]> {
    const db = await getDb();
    const levels = LEVELS_AT_LEAST[opts.minLevel ?? 'debug'];
    const rows = await db.getAllAsync<DiagnosticRow>(
      `SELECT * FROM diagnostic_logs WHERE level IN (${levels.map(() => '?').join(', ')})
       ORDER BY id DESC LIMIT ?`,
      [...levels, opts.limit],
    );
    return rows.map(rowToEvent);
  }

  async countByLevel(): Promise<Record<DiagnosticLevel, number>> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ level: string; n: number }>(
      'SELECT level, COUNT(*) AS n FROM diagnostic_logs GROUP BY level',
    );
    const counts: Record<DiagnosticLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };
    for (const r of rows) {
      if (r.level in counts) counts[r.level as DiagnosticLevel] = r.n;
    }
    return counts;
  }

  /** Drop rows older than `maxAgeDays`, then all but the newest `maxRows`. */
  async prune(maxRows: number, maxAgeDays: number): Promise<void> {
    const db = await getDb();
    const cutoff = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString();
    await db.runAsync('DELETE FROM diagnostic_logs WHERE at < ?', [cutoff]);
    await db.runAsync(
      `DELETE FROM diagnostic_logs WHERE id NOT IN (
         SELECT id FROM diagnostic_logs ORDER BY id DESC LIMIT ?
       )`,
      [maxRows],
    );
  }

  async clear(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM diagnostic_logs');
  }
}
