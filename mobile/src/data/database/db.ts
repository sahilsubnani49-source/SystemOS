import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

// Cache the in-flight PROMISE, not the resolved db. Bootstrap loads 4 stores in
// parallel, so 4 callers hit getDb() at once; if we cached only the resolved db,
// all 4 would slip past a `if (_db)` guard before any finished and call
// openDatabaseAsync() concurrently — racing to create the files/SQLite directory.
// SDK 56's expo-sqlite rejects that race ("path already points to a non-normal
// file"). Caching the promise collapses N concurrent opens into one.
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_dbPromise) {
    // If the open rejects, drop the cached promise so the next caller retries a
    // fresh open instead of re-awaiting a permanently-rejected one.
    _dbPromise = openAndMigrate().catch((err) => {
      _dbPromise = null;
      throw err;
    });
  }
  return _dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const _db = await SQLite.openDatabaseAsync('systemos.db');

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
    // Hunter Log categories can mirror time recorded elsewhere (Army-tab gym hours).
    `ALTER TABLE task_categories ADD COLUMN source TEXT`,
    // Backfill for installs seeded before `source` existed: the default Gym bucket is
    // the one that absorbs gym_sessions. Guarded by source IS NULL so a later rename
    // or a deliberate unlink is never re-applied on the next open.
    `UPDATE task_categories SET source = 'gym' WHERE source IS NULL AND name = 'Gym'`,
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
