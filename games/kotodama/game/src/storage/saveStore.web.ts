import { migrateSave, type Save } from '@kotodama/core';
import type { SaveStore } from './saveStore';

export type { SaveStore };

/** Web build: expo-sqlite needs cross-origin isolation, so saves use localStorage. */
export function createSaveStore(databaseName: string): SaveStore {
  const key = `${databaseName}:save`;
  return {
    async load() {
      try {
        const raw = globalThis.localStorage?.getItem(key);
        return raw ? migrateSave(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    },
    async save(save) {
      try {
        globalThis.localStorage?.setItem(key, JSON.stringify(save));
      } catch {
        // Private mode / quota: the session still plays, it just won't persist.
      }
    },
    async clear() {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}
