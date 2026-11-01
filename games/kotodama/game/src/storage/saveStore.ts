import * as SQLite from 'expo-sqlite';
import { migrateSave, type Save } from '@kotodama/core';

/**
 * Native save storage: the game's OWN SQLite file (default kotodama.db), never a
 * host app's database. One key-value table keeps the schema migration-free; the
 * save JSON carries its own version (see migrateSave in core).
 */
export interface SaveStore {
  load(): Promise<Save | null>;
  save(save: Save): Promise<void>;
  clear(): Promise<void>;
}

export function createSaveStore(databaseName: string): SaveStore {
  let db: Promise<SQLite.SQLiteDatabase> | null = null;
  const open = () => {
    db ??= SQLite.openDatabaseAsync(databaseName).then(async (d) => {
      await d.execAsync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
      return d;
    });
    return db;
  };
  return {
    async load() {
      const d = await open();
      const row = await d.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', ['save']);
      if (!row) return null;
      try {
        return migrateSave(JSON.parse(row.value));
      } catch {
        return null;
      }
    },
    async save(save) {
      const d = await open();
      await d.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', ['save', JSON.stringify(save)]);
    },
    async clear() {
      const d = await open();
      await d.runAsync('DELETE FROM kv WHERE key = ?', ['save']);
    },
  };
}
