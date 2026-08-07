import { getDb } from '../database/db';
import { getMeta, setMeta } from './AppMeta';

// Multi-user device binding. SystemOS is offline-first: local SQLite holds one
// Hunter's progression at a time. When a user authenticates we compare the account
// id to the id the local data belongs to (`bound_user_id` in app_meta):
//   - absent  → first login on this device: adopt the existing local data, bind it.
//   - same    → same Hunter returning: proceed untouched.
//   - different→ a different account: wipe the domain tables so we don't blend two
//                Hunters, rebind, and let loadData() reseed from the API.
// This is a pure data concern, so it lives in the data layer (not a store).

const BOUND_USER_ID_KEY = 'bound_user_id';

// Every table that stores a single Hunter's domain data. app_meta is intentionally
// excluded — it holds device-wide keys (binding, timeline cursors) we must keep.
const DOMAIN_TABLES = [
  'players',
  'goals',
  'quests',
  'dynamic_items',
  'shadow_soldiers',
  'training_exercises',
  'gym_sessions',
  // Includes any in-flight focus timer (the ended_at IS NULL row) — which is exactly
  // why the running timer lives here and not in app_meta, where it would survive a
  // different Hunter signing in.
  'time_logs',
];

/** Wipe all per-Hunter domain tables. Keeps app_meta (device binding + cursors). */
export async function clearAllLocalData(): Promise<void> {
  const db = await getDb();
  for (const table of DOMAIN_TABLES) {
    // Tables are ensured on open (getDb), so a bare DELETE is safe.
    await db.runAsync(`DELETE FROM ${table}`);
  }
}

/**
 * Reconcile the local device data with the authenticated user.
 * Returns whether local data was wiped (the caller/loadData must reseed if so).
 */
export async function reconcileDeviceBinding(userId: string): Promise<{ wiped: boolean }> {
  const boundId = await getMeta(BOUND_USER_ID_KEY);

  if (boundId === userId) {
    return { wiped: false };
  }

  if (boundId === null) {
    // First login on this device — adopt whatever local data exists.
    await setMeta(BOUND_USER_ID_KEY, userId);
    return { wiped: false };
  }

  // A different Hunter signed in — clear the previous Hunter's data and rebind.
  await clearAllLocalData();
  await setMeta(BOUND_USER_ID_KEY, userId);
  return { wiped: true };
}
