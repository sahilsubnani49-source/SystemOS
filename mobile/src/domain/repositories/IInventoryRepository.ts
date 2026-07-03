import { DynamicItem } from '../models/DynamicItem';

export interface IInventoryRepository {
  getItems(): Promise<DynamicItem[]>;
  addItem(item: DynamicItem): Promise<void>;
  /** Permanently delete an item (it has been consumed). */
  deleteItem(itemId: string): Promise<void>;
  clearItems(): Promise<void>;
}
