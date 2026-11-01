import { parseMap, type MapDef, type ParsedMap } from '../types';
import { ARC1_MAPS } from './arc1';
import { ARC2_MAPS } from './arc2';

export const ALL_MAPS: readonly MapDef[] = [...ARC1_MAPS, ...ARC2_MAPS];

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
