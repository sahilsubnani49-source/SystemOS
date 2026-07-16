import { getDb } from '../database/db';
import { NotificationService } from '../../core/NotificationService';

const CREATE_META_TABLE = `
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )
`;

const LAST_RESET_KEY = 'last_quest_reset_date';

async function ensureMetaTable() {
  const db = await getDb();
  await db.execAsync(CREATE_META_TABLE);
}

async function getMetaValue(key: string): Promise<string | null> {
  await ensureMetaTable();
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

async function setMetaValue(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [key, value]);
}

export const DailyResetService = {
  /**
   * Call on every app foreground / boot.
   * If today's date differs from the last reset date, resets quests
   * and fires the daily quest notification.
   *
   * Returns true if a reset was performed.
   */
  async checkAndReset(resetQuests: () => Promise<void>): Promise<boolean> {
    const today = new Date().toDateString(); // e.g. "Mon Jun 16 2026"
    const lastReset = await getMetaValue(LAST_RESET_KEY);

    if (lastReset === today) return false;

    // New day — perform reset
    await resetQuests();
    await setMetaValue(LAST_RESET_KEY, today);

    // Fire daily quest notification
    try {
      await NotificationService.send(
        '[Daily Quest has arrived.]',
        'New challenges await, Hunter. Rise and conquer.',
      );
    } catch {
      // Notification permission may not be granted yet
    }

    return true;
  },

  /**
   * Force-mark today as reset without actually resetting quests.
   * Useful for seeding first-time users so they don't get reset on first open.
   */
  async markTodayAsReset(): Promise<void> {
    await setMetaValue(LAST_RESET_KEY, new Date().toDateString());
  },

  async getLastResetDate(): Promise<string | null> {
    return getMetaValue(LAST_RESET_KEY);
  },
};
