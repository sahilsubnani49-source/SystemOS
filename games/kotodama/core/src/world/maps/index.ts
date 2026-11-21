import { parseMap, type MapDef, type ParsedMap } from '../types';
import { ARC1_MAPS } from './arc1';
import { ARC2_MAPS } from './arc2';
import { ARC3_MAPS } from './arc3';
import { ARC4_MAPS } from './arc4';
import { ARC5_MAPS } from './arc5';
import { WELL_MAPS } from './well';
import { TERAKOYA_MAPS } from './terakoya';
import { HONSAI_MAPS, KAITO_HONSAI } from './honsai';
import { HONSAI_MAPS_2 } from './honsai2';
import { HONSAI_MAPS_3 } from './honsai3';
import { HONSAI_MAPS_4 } from './honsai4';
import { townsfolkFor } from '../townsfolk';
import { withTaleSites } from '../taleSites';
import { withStoryHalls } from '../storyHalls';

// Townsfolk (world/townsfolk.ts) join each map's own NPCs here, so map files stay about the story.
// Then each folk tale's signpost joins its host map, and its scene becomes a map (world/taleSites.ts).
export const ALL_MAPS: readonly MapDef[] = withStoryHalls(withTaleSites(
  [...ARC1_MAPS, ...ARC2_MAPS, ...ARC3_MAPS, ...ARC4_MAPS, ...ARC5_MAPS, ...WELL_MAPS, ...TERAKOYA_MAPS, ...HONSAI_MAPS, ...HONSAI_MAPS_2, ...HONSAI_MAPS_3, ...HONSAI_MAPS_4].map(
    (d) => ({ ...d, npcs: [...withHonsaiKaito(d), ...townsfolkFor(d.id)] }),
  ),
));

/** After the ending, Master Kaito stops sending you to Goro and opens the road to Honsai. */
function withHonsaiKaito(d: MapDef) {
  if (d.id !== 'hayate_dojo') return d.npcs;
  return [...d.npcs.map((n) => (n.id === 'master_kaito_after' ? { ...n, hideIf: 'game_complete' } : n)), ...KAITO_HONSAI];
}

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
