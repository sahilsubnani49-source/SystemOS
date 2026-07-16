import { getDb } from './db';

export type MutationType = 'COMPLETE_QUEST';

export interface PendingMutation {
  id: number;
  type: MutationType;
  payload: string; // JSON stringified
  createdAt: string;
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS mutation_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;

async function ensureTable() {
  const db = await getDb();
  await db.execAsync(CREATE_TABLE_SQL);
}

export const MutationQueue = {
  async push(type: MutationType, payload: Record<string, unknown>): Promise<void> {
    await ensureTable();
    const db = await getDb();
    await db.runAsync('INSERT INTO mutation_queue (type, payload, created_at) VALUES (?, ?, ?)', [
      type,
      JSON.stringify(payload),
      new Date().toISOString(),
    ]);
  },

  async getAll(): Promise<PendingMutation[]> {
    await ensureTable();
    const db = await getDb();
    return db.getAllAsync<PendingMutation>('SELECT * FROM mutation_queue ORDER BY created_at ASC');
  },

  async remove(id: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM mutation_queue WHERE id = ?', [id]);
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM mutation_queue');
  },
};
