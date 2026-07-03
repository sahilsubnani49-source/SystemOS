import { getDb } from '../database/db';

// Shared key-value access to the app_meta table (also used by DailyResetService).
// The table is created in schema.ts via DailyResetService's bootstrap, but we ensure
// it here too so this module is safe to use independently.

const CREATE_META_TABLE = `
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )
`;

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  await db.execAsync(CREATE_META_TABLE);
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execAsync(CREATE_META_TABLE);
  await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [key, value]);
}

export async function deleteMeta(key: string): Promise<void> {
  const db = await getDb();
  await db.execAsync(CREATE_META_TABLE);
  await db.runAsync('DELETE FROM app_meta WHERE key = ?', [key]);
}
