import type { Plan, PlanItem } from '@yotei/core';
import type { YoteiStore } from './store';

export type { YoteiStore };

/** Web build: expo-sqlite needs cross-origin isolation, so the web build uses localStorage. */
export function createYoteiStore(databaseName: string): YoteiStore {
  const key = `${databaseName}:data`;
  type Data = { plans: Plan[]; items: PlanItem[] };
  const read = (): Data => {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      return raw ? (JSON.parse(raw) as Data) : { plans: [], items: [] };
    } catch {
      return { plans: [], items: [] };
    }
  };
  const write = (d: Data) => globalThis.localStorage?.setItem(key, JSON.stringify(d));

  return {
    async listPlans() {
      return [...read().plans].sort(
        (a, b) => Number(a.archived) - Number(b.archived) || (a.createdAt < b.createdAt ? 1 : -1),
      );
    },
    async getItems(planId) {
      return read().items.filter((i) => i.planId === planId).sort((a, b) => a.sort - b.sort);
    },
    async savePlan(plan, items) {
      const d = read();
      write({ plans: [...d.plans, plan], items: [...d.items, ...items] });
    },
    async setDone(itemId, doneAt) {
      const d = read();
      write({ ...d, items: d.items.map((i) => (i.id === itemId ? { ...i, doneAt } : i)) });
    },
    async setArchived(planId, archived) {
      const d = read();
      write({ ...d, plans: d.plans.map((p) => (p.id === planId ? { ...p, archived } : p)) });
    },
    async deletePlan(planId) {
      const d = read();
      write({ plans: d.plans.filter((p) => p.id !== planId), items: d.items.filter((i) => i.planId !== planId) });
    },
  };
}
