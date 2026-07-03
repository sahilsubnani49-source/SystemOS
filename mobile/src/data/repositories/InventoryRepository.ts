import { getDb } from '../database/db';
import { DynamicItem, ItemType } from '../../domain/models/DynamicItem';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { Rarity } from '../../core/constants';

function rowToItem(row: Record<string, unknown>): DynamicItem {
  // Anything that isn't a coupon type (including legacy gear rows) files under weapons.
  const rawType = (row.type as string) ?? 'token';
  const type: ItemType = rawType === 'token' || rawType === 'potion' ? rawType : 'weapon';
  return {
    id: row.id as string,
    type,
    name: row.name as string,
    description: row.description as string,
    rarity: row.rarity as Rarity,
  };
}

export class InventoryRepository implements IInventoryRepository {
  async getItems(): Promise<DynamicItem[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM dynamic_items');
    return rows.map(rowToItem);
  }

  async addItem(item: DynamicItem): Promise<void> {
    // Only the live columns are written; legacy stat columns keep their table defaults.
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO dynamic_items (id, type, name, description, rarity)
       VALUES (?, ?, ?, ?, ?)`,
      [item.id, item.type, item.name, item.description, item.rarity],
    );
  }

  async deleteItem(itemId: string): Promise<void> {
    // Using an item consumes it permanently — the row is removed for good.
    const db = await getDb();
    await db.runAsync('DELETE FROM dynamic_items WHERE id = ?', [itemId]);
  }

  async clearItems(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM dynamic_items');
  }
}
