import { getDb } from '../database/db';
import { ApiDataSource } from '../datasources/ApiDataSource';

/**
 * Connectivity diagnostics for the Settings debug panel.
 * Each check answers one question with a boolean — details stay in dev logs.
 */
export const DiagnosticsService = {
  /** Is the FastAPI backend reachable? (GET /health, fail-fast timeout) */
  async checkBackend(): Promise<boolean> {
    try {
      await ApiDataSource.checkHealth();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Does the configured LLM provider actually answer? The backend performs a
   * one-word ping, so this is a real end-to-end AI round trip — it fails when
   * the API key is missing/revoked or the local Ollama server is down, even
   * if the backend itself is healthy.
   */
  async checkLlm(modelPreference: string): Promise<boolean> {
    try {
      await ApiDataSource.checkLlmHealth(modelPreference);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Is the local SQLite database open and usable? Queries a real table rather
   * than `SELECT 1` so a corrupted or half-migrated schema also fails the check.
   */
  async checkDatabase(): Promise<boolean> {
    try {
      const db = await getDb();
      await db.getFirstAsync('SELECT COUNT(*) FROM players');
      return true;
    } catch {
      return false;
    }
  },
};
