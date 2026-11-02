import * as SQLite from 'expo-sqlite';
import type { Plan, PlanItem } from '@yotei/core';

/**
 * Yotei's own database (default yotei.db), never a host's. Schema changes must be
 * additive: the device holds the only copy of the user's plans and progress.
 */
export interface YoteiStore {
  listPlans(): Promise<Plan[]>;
  getItems(planId: string): Promise<PlanItem[]>;
  /** The plan and all its items, in one transaction. */
  savePlan(plan: Plan, items: PlanItem[]): Promise<void>;
  setDone(itemId: string, doneAt: string | null): Promise<void>;
  setArchived(planId: string, archived: boolean): Promise<void>;
  deletePlan(planId: string): Promise<void>;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    source_md TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    timezone TEXT NOT NULL,
    unit TEXT NOT NULL,
    start TEXT NOT NULL,
    "end" TEXT NOT NULL,
    boundary_quote TEXT NOT NULL,
    created_at TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS plan_items (
    id TEXT PRIMARY KEY NOT NULL,
    plan_id TEXT NOT NULL,
    text TEXT NOT NULL,
    period_quote TEXT NOT NULL,
    unit TEXT NOT NULL,
    start TEXT NOT NULL,
    "end" TEXT NOT NULL,
    timed INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL,
    done_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON plan_items (plan_id, start)`,
];

interface PlanRow {
  id: string;
  title: string;
  source_md: string;
  source_hash: string;
  timezone: string;
  unit: Plan['unit'];
  start: string;
  end: string;
  boundary_quote: string;
  created_at: string;
  archived: number;
}

interface ItemRow {
  id: string;
  plan_id: string;
  text: string;
  period_quote: string;
  unit: PlanItem['unit'];
  start: string;
  end: string;
  timed: number;
  sort: number;
  done_at: string | null;
}

const rowToPlan = (r: PlanRow): Plan => ({
  id: r.id,
  title: r.title,
  sourceMd: r.source_md,
  sourceHash: r.source_hash,
  timezone: r.timezone,
  unit: r.unit,
  start: r.start,
  end: r.end,
  boundaryQuote: r.boundary_quote,
  createdAt: r.created_at,
  archived: r.archived === 1,
});

const rowToItem = (r: ItemRow): PlanItem => ({
  id: r.id,
  planId: r.plan_id,
  text: r.text,
  periodQuote: r.period_quote,
  unit: r.unit,
  start: r.start,
  end: r.end,
  timed: r.timed === 1,
  sort: r.sort,
  doneAt: r.done_at,
});

/** Rows per multi-row INSERT: 10 params each keeps under SQLite's 999-variable floor. */
const ROWS_PER_INSERT = 90;

export function createYoteiStore(databaseName: string): YoteiStore {
  let db: Promise<SQLite.SQLiteDatabase> | null = null;
  const open = () => {
    // Cache the promise so concurrent first calls share one open.
    db ??= SQLite.openDatabaseAsync(databaseName)
      .then(async (d) => {
        await d.execAsync('PRAGMA journal_mode = WAL;');
        for (const sql of SCHEMA) await d.execAsync(sql);
        return d;
      })
      .catch((e) => {
        db = null;
        throw e;
      });
    return db;
  };

  return {
    async listPlans() {
      const d = await open();
      const rows = await d.getAllAsync<PlanRow>('SELECT * FROM plans ORDER BY archived ASC, created_at DESC');
      return rows.map(rowToPlan);
    },
    async getItems(planId) {
      const d = await open();
      const rows = await d.getAllAsync<ItemRow>('SELECT * FROM plan_items WHERE plan_id = ? ORDER BY sort ASC', [planId]);
      return rows.map(rowToItem);
    },
    async savePlan(plan, items) {
      const d = await open();
      await d.withTransactionAsync(async () => {
        await d.runAsync(
          `INSERT INTO plans (id, title, source_md, source_hash, timezone, unit, start, "end", boundary_quote, created_at, archived)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [plan.id, plan.title, plan.sourceMd, plan.sourceHash, plan.timezone, plan.unit, plan.start, plan.end,
            plan.boundaryQuote, plan.createdAt, plan.archived ? 1 : 0],
        );
        for (let i = 0; i < items.length; i += ROWS_PER_INSERT) {
          const batch = items.slice(i, i + ROWS_PER_INSERT);
          await d.runAsync(
            `INSERT INTO plan_items (id, plan_id, text, period_quote, unit, start, "end", timed, sort, done_at)
             VALUES ${batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
            batch.flatMap((it) => [it.id, it.planId, it.text, it.periodQuote, it.unit, it.start, it.end,
              it.timed ? 1 : 0, it.sort, it.doneAt]),
          );
        }
      });
    },
    async setDone(itemId, doneAt) {
      const d = await open();
      await d.runAsync('UPDATE plan_items SET done_at = ? WHERE id = ?', [doneAt, itemId]);
    },
    async setArchived(planId, archived) {
      const d = await open();
      await d.runAsync('UPDATE plans SET archived = ? WHERE id = ?', [archived ? 1 : 0, planId]);
    },
    async deletePlan(planId) {
      const d = await open();
      await d.withTransactionAsync(async () => {
        await d.runAsync('DELETE FROM plan_items WHERE plan_id = ?', [planId]);
        await d.runAsync('DELETE FROM plans WHERE id = ?', [planId]);
      });
    },
  };
}
