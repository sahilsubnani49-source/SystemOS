import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  NoTimeLimitError,
  deviceTimeZone,
  resolvePlan,
  verifyItems,
  wallClock,
  wallDate,
  type Plan,
  type PlanDraft,
  type PlanItem,
  type WallTime,
} from '@yotei/core';
import type { YoteiStore } from '../storage/store';
import type { YoteiAppProps, YoteiDiagnostic } from '../types';

export type Screen = 'loading' | 'now' | 'import' | 'review' | 'plans' | 'source';

export interface YoteiState {
  screen: Screen;
  plans: Plan[];
  activeId: string | null;
  items: PlanItem[];
  /** The user's current wall-clock time, in the device's CURRENT timezone. */
  now: WallTime;
  timezone: string;
  error: string | null;

  importText: string;
  importName: string | null;
  analyzing: boolean;
  draft: PlanDraft | null;
  /** Items the device's own re-check dropped (server drift guard). */
  deviceRejected: PlanDraft['rejected'];
  startDate: string;
  startTime: string;
  sourcePlanId: string | null;

  boot(): Promise<void>;
  tick(): void;
  go(screen: Screen): void;
  setImportText(text: string, name?: string | null): void;
  analyze(): Promise<void>;
  setStartDate(date: string): void;
  setStartTime(time: string): void;
  saveDraft(): Promise<void>;
  discardDraft(): void;
  toggleDone(itemId: string): Promise<void>;
  selectPlan(planId: string): Promise<void>;
  archivePlan(planId: string, archived: boolean): Promise<void>;
  deletePlan(planId: string): Promise<void>;
  viewSource(planId: string): void;
  clearError(): void;
}

export interface YoteiDeps {
  store: YoteiStore;
  parsePlan: YoteiAppProps['parsePlan'];
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

    const loadActive = async (planId: string | null) => {
      const items = planId ? await deps.store.getItems(planId) : [];
      set({ activeId: planId, items });
    };

    return {
      screen: 'loading',
      plans: [],
      activeId: null,
      items: [],
      now: nowWall(),
      timezone: deviceTimeZone(),
      error: null,
      importText: '',
      importName: null,
      analyzing: false,
      draft: null,
      deviceRejected: [],
      startDate: wallDate(nowWall()),
      startTime: '09:00',
      sourcePlanId: null,

      async boot() {
        try {
          const plans = await deps.store.listPlans();
          const first = plans.find((p) => !p.archived) ?? null;
          set({ plans });
          await loadActive(first?.id ?? null);
          set({ screen: first ? 'now' : 'import' });
        } catch (e) {
          fail('Could not open Yotei\'s data', e);
          set({ screen: 'import' });
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

      setImportText(text, name = null) {
        set({ importText: text, importName: name });
      },

      async analyze() {
        const md = get().importText;
        if (!md.trim() || get().analyzing) return;
        set({ analyzing: true, error: null });
        try {
          const draft = await deps.parsePlan(md);
          // Never trust the server blindly: re-check every quote against the planner here.
          const { kept, rejected } = verifyItems(md, draft.items);
          const today = wallDate(nowWall());
          set({
            analyzing: false,
            draft: { ...draft, items: kept },
            deviceRejected: rejected,
            startDate: draft.startDate ?? today,
            screen: 'review',
          });
        } catch (e) {
          set({ analyzing: false });
          fail('Could not read the planner', e);
        }
      },

      setStartDate(date) {
        set({ startDate: date });
      },
      setStartTime(time) {
        set({ startTime: time });
      },

      async saveDraft() {
        const { draft, importText, startDate, startTime } = get();
        if (!draft) return;
        try {
          const { plan, items } = resolvePlan(draft, {
            startDate,
            startTime,
            timezone: deviceTimeZone(),
            sourceMd: importText,
            makeId,
            nowIso: new Date().toISOString(),
          });
          await deps.store.savePlan(plan, items);
          const plans = await deps.store.listPlans();
          set({ plans, draft: null, deviceRejected: [], importText: '', importName: null, screen: 'now', now: nowWall() });
          await loadActive(plan.id);
          deps.report({ level: 'info', message: 'Plan saved', data: { items: items.length, unit: plan.unit } });
        } catch (e) {
          if (e instanceof NoTimeLimitError) set({ error: e.message });
          else fail('Could not save the plan', e);
        }
      },

      discardDraft() {
        set({ draft: null, deviceRejected: [], screen: 'import' });
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

      async selectPlan(planId) {
        await loadActive(planId);
        set({ screen: 'now', now: nowWall() });
      },

      async archivePlan(planId, archived) {
        await deps.store.setArchived(planId, archived);
        const plans = await deps.store.listPlans();
        set({ plans });
        if (archived && get().activeId === planId) {
          await loadActive(plans.find((p) => !p.archived)?.id ?? null);
        }
      },

      async deletePlan(planId) {
        await deps.store.deletePlan(planId);
        const plans = await deps.store.listPlans();
        set({ plans });
        if (get().activeId === planId) await loadActive(plans.find((p) => !p.archived)?.id ?? null);
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
