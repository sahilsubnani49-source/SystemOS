import React, { createContext, useContext, useMemo } from 'react';
import { useStore, type StoreApi } from 'zustand';
import type { Plan, PlanItem } from '@yotei/core';
import type { YoteiState } from './yoteiStore';
import { planColor } from '../theme';

const Ctx = createContext<StoreApi<YoteiState> | null>(null);
export const YoteiStoreProvider = Ctx.Provider;

export function useYoteiApi(): StoreApi<YoteiState> {
  const s = useContext(Ctx);
  if (!s) throw new Error('Yotei components must be inside <YoteiApp/>');
  return s;
}

export function useYotei<T>(selector: (s: YoteiState) => T): T {
  return useStore(useYoteiApi(), selector);
}

/** Items of plans that aren't archived: what Today, Week and Year show. */
export function useActiveItems(): PlanItem[] {
  const plans = useYotei((s) => s.plans);
  const items = useYotei((s) => s.items);
  return useMemo(() => {
    const active = new Set(plans.filter((p) => !p.archived).map((p) => p.id));
    return items.filter((i) => active.has(i.planId));
  }, [plans, items]);
}

export interface PlanLook {
  title: string;
  color: string;
}

/** Each plan's title and colour, by id, for tagging items from several plans. */
export function usePlanLooks(): Map<string, PlanLook> {
  const plans = useYotei((s) => s.plans);
  return useMemo(() => new Map(plans.map((p: Plan) => [p.id, { title: p.title, color: planColor(p.id) }])), [plans]);
}
