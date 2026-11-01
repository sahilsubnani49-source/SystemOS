import { parseMap, type MapDef, type ParsedMap } from '../types';
import { ARC1_MAPS } from './arc1';
import { ARC2_MAPS } from './arc2';
import { ARC3_MAPS } from './arc3';
import { ARC4_MAPS } from './arc4';
import { ARC5_MAPS } from './arc5';

export const ALL_MAPS: readonly MapDef[] = [...ARC1_MAPS, ...ARC2_MAPS, ...ARC3_MAPS, ...ARC4_MAPS, ...ARC5_MAPS];

const parsed = new Map<string, ParsedMap>();

export function getMap(id: string): ParsedMap {
  let m = parsed.get(id);
  if (!m) {
    const def = ALL_MAPS.find((d) => d.id === id);
    if (!def) throw new Error(`Unknown map: ${id}`);
    m = parseMap(def);
    parsed.set(id, m);
  }
  return m;
}
