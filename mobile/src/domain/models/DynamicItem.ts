import { Rarity } from '../../core/constants';

/**
 * token / potion are real-world indulgence coupons; weapon covers gear-style
 * drops (and any legacy item rows whose type predates the coupon system).
 */
export type ItemType = 'token' | 'potion' | 'weapon';

export interface DynamicItem {
  id: string;
  type: ItemType; // token = active leisure/social, potion = rest/self-care
  name: string;
  description: string; // the real-world indulgence + its amount/duration
  rarity: Rarity; // scales how generous the indulgence is
}
