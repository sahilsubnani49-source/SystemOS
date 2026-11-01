import React, { createContext, useContext } from 'react';
import { useStore, type StoreApi } from 'zustand';
import type { GameState } from './gameStore';

const Ctx = createContext<StoreApi<GameState> | null>(null);

export const GameStoreProvider = Ctx.Provider;

/** Select from THIS game instance's store (each <KotodamaGame/> owns one). */
export function useGame<T>(selector: (s: GameState) => T): T {
  const store = useContext(Ctx);
  if (!store) throw new Error('useGame outside <KotodamaGame/>');
  return useStore(store, selector);
}

export function useGameApi(): StoreApi<GameState> {
  const store = useContext(Ctx);
  if (!store) throw new Error('useGameApi outside <KotodamaGame/>');
  return store;
}
