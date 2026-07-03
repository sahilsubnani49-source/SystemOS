import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync('systemos.db');

  // Enable WAL mode for better concurrent read performance
  await _db.execAsync('PRAGMA journal_mode = WAL;');

  // Create all tables
  for (const sql of CREATE_TABLES_SQL) {
    await _db.execAsync(sql);
  }

  // Schema migrations — SQLite has no "ADD COLUMN IF NOT EXISTS", so each ALTER is
  // wrapped individually: it throws (and is ignored) once the column already exists.
  const MIGRATIONS = [
    `ALTER TABLE players ADD COLUMN aspirations TEXT DEFAULT ''`,
    // Goal-driven timeline feature — Hunter Rank + dungeon keys on the player.
    `ALTER TABLE players ADD COLUMN rank TEXT NOT NULL DEFAULT 'E-Rank'`,
    `ALTER TABLE players ADD COLUMN keys INTEGER NOT NULL DEFAULT 0`,
    // Dated/scheduled quests + dungeon (mock-exam) support.
    `ALTER TABLE quests ADD COLUMN goal_id TEXT`,
    `ALTER TABLE quests ADD COLUMN scheduled_for TEXT`,
    `ALTER TABLE quests ADD COLUMN quest_type TEXT NOT NULL DEFAULT 'daily'`,
    `ALTER TABLE quests ADD COLUMN dungeon_challenge TEXT`,
    `ALTER TABLE quests ADD COLUMN dungeon_result TEXT`,
    // Accept → timer: when the player accepted the quest (drives the stopwatch).
    `ALTER TABLE quests ADD COLUMN accepted_at TEXT`,
    // Rewards are now real-world token/potion coupons — classify each one.
    `ALTER TABLE dynamic_items ADD COLUMN type TEXT NOT NULL DEFAULT 'token'`,
  ];

  for (const sql of MIGRATIONS) {
    try {
      await _db.execAsync(sql);
    } catch {
      // Column already exists — expected on all but the first open.
    }
  }

  return _db;
}
