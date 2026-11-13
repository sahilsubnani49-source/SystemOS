import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  deviceTimeZone,
  parsePlanJson,
  resolvePlan,
  wallClock,
  wallDate,
  type Plan,
  type PlanItem,
  type WallTime,
} from '@yotei/core';
import type { YoteiStore } from '../storage/store';
import type { YoteiDiagnostic } from '../types';

export type Screen = 'loading' | 'today' | 'week' | 'year' | 'plans' | 'add' | 'source';

export interface YoteiState {
  screen: Screen;
  plans: Plan[];
  /** Items of every plan; screens filter out archived plans with useActiveItems(). */
  items: PlanItem[];
  /** The user's current wall-clock time, in the device's CURRENT timezone. */
  now: WallTime;
  timezone: string;
  error: string | null;

  /** The Add screen's pasted JSON, kept across tab switches. */
  draftText: string;
  draftName: string | null;
  /** YYYY-MM-DD, used when the JSON gives no "start". */
  startDate: string;
  sourcePlanId: string | null;

  boot(): Promise<void>;
  tick(): void;
  go(screen: Screen): void;
  setDraftText(text: string, name?: string | null): void;
  setStartDate(date: string): void;
  /** Parse, date and store the draft. Resolves true when saved. */
  savePlan(): Promise<boolean>;
  toggleDone(itemId: string): Promise<void>;
  archivePlan(planId: string, archived: boolean): Promise<void>;
  deletePlan(planId: string): Promise<void>;
  viewSource(planId: string): void;
  clearError(): void;
}

export interface YoteiDeps {
  store: YoteiStore;
  report: (e: YoteiDiagnostic) => void;
  makeId?: () => string;
}

const defaultId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const nowWall = () => wallClock(new Date());
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function createYoteiState(deps: YoteiDeps): StoreApi<YoteiState> {
  const makeId = deps.makeId ?? defaultId;

  return createStore<YoteiState>((set, get) => {
    const fail = (message: string, e: unknown, data?: Record<string, unknown>) => {
      deps.report({ level: 'error', message, data: { ...data, error: errText(e) } });
      set({ error: `${message}: ${errText(e)}` });
    };

    const reload = async () => {
      const [plans, items] = await Promise.all([deps.store.listPlans(), deps.store.getAllItems()]);
      set({ plans, items });
      return plans;
    };

    return {
      screen: 'loading',
      plans: [],
      items: [],
      now: nowWall(),
      timezone: deviceTimeZone(),
      error: null,
      draftText: '',
      draftName: null,
      startDate: wallDate(nowWall()),
      sourcePlanId: null,

      async boot() {
        try {
          const plans = await reload();
          set({ screen: plans.some((p) => !p.archived) ? 'today' : 'add' });
        } catch (e) {
          fail("Could not open Yotei's data", e);
          set({ screen: 'add' });
        }
      },

      // Called on a timer and on app foreground. Re-reads the timezone too, so a
      // traveller's "now" follows them.
      tick() {
        set({ now: nowWall(), timezone: deviceTimeZone() });
      },

      go(screen) {
        set({ screen, error: null });
      },

      setDraftText(text, name = null) {
        set({ draftText: text, draftName: name });
      },

      setStartDate(date) {
        set({ startDate: date });
      },

      async savePlan() {
        const { draftText, startDate } = get();
        const parsed = parsePlanJson(draftText);
        if (!parsed.spec) {
          set({ error: parsed.errors[0]?.message ?? 'Paste a plan first.' });
          return false;
        }
        try {
          const { plan, items } = resolvePlan(parsed.spec, {
            startDate,
            timezone: deviceTimeZone(),
            source: draftText,
            makeId,
            nowIso: new Date().toISOString(),
          });
          await deps.store.savePlan(plan, items);
          await reload();
          set({ draftText: '', draftName: null, startDate: wallDate(nowWall()), screen: 'today', now: nowWall() });
          deps.report({ level: 'info', message: 'Plan saved', data: { items: items.length, unit: plan.unit } });
          return true;
        } catch (e) {
          fail('Could not save the plan', e);
          return false;
        }
      },

      async toggleDone(itemId) {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return;
        const doneAt = item.doneAt ? null : new Date().toISOString();
        // Optimistic, then persist; roll back if the write fails.
        set({ items: get().items.map((i) => (i.id === itemId ? { ...i, doneAt } : i)) });
        try {
          await deps.store.setDone(itemId, doneAt);
        } catch (e) {
          set({ items: get().items.map((i) => (i.id === itemId ? { ...i, doneAt: item.doneAt } : i)) });
          fail('Could not save that', e);
        }
      },

      async archivePlan(planId, archived) {
        try {
          await deps.store.setArchived(planId, archived);
          await reload();
        } catch (e) {
          fail('Could not archive the plan', e);
        }
      },

      async deletePlan(planId) {
        try {
          await deps.store.deletePlan(planId);
          await reload();
        } catch (e) {
          fail('Could not delete the plan', e);
        }
      },

      viewSource(planId) {
        set({ sourcePlanId: planId, screen: 'source' });
      },

      clearError() {
        set({ error: null });
      },
    };
  });
}
