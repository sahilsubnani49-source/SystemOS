import React, { createContext, useContext } from 'react';
import { useStore, type StoreApi } from 'zustand';
import type { YoteiState } from './yoteiStore';

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
