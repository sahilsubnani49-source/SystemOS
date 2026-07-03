import { create } from 'zustand';
import { DynamicItem } from '../../domain/models/DynamicItem';
import { InventoryRepository } from '../../data/repositories/InventoryRepository';

const repo = new InventoryRepository();

interface InventoryState {
  items: DynamicItem[];
  loading: boolean;
  load: () => Promise<void>;
  /** Redeem a reward: permanently delete it (the player goes and enjoys it). Returns the redeemed item. */
  useItem: (itemId: string) => Promise<DynamicItem | null>;
  clear: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const items = await repo.getItems();
    set({ items, loading: false });
  },

  useItem: async (itemId: string) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return null;

    // Redeeming consumes the reward permanently — it can never be recovered.
    await repo.deleteItem(itemId);
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
    return item;
  },

  clear: async () => {
    await repo.clearItems();
    set({ items: [] });
  },
}));
