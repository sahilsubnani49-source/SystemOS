import { describe, expect, it } from 'vitest';
import { ALL_CHECKPOINTS, checkpointFor } from '../world/checkpoints';
import { getMap } from '../world/maps';
import { isWalkable, warpAt } from '../world/types';

describe('checkpoints', () => {
  it('wake you in the arc you fell in, not at the first dojo', () => {
    expect(checkpointFor('bamboo_grove').mapId).toBe('hayate_dojo');
    expect(checkpointFor('fjord_caves').mapId).toBe('frost_harbor');
    expect(checkpointFor('shogun_hall').mapId).toBe('teahouse');
    expect(checkpointFor('terakoya_n4').mapId).toBe('teahouse');
    expect(checkpointFor('tengu_summit').mapId).toBe('monastery');
    expect(checkpointFor('runeforge_throne').mapId).toBe('rune_coast');
    expect(checkpointFor('well_deep').mapId).toBe('sakura_village');
  });

  it('are on open ground, never on a person or a doorway, for any story state', () => {
    for (const c of ALL_CHECKPOINTS) {
      const map = getMap(c.mapId);
      for (const flags of [{}, Object.fromEntries(map.def.npcs.flatMap((n) => [n.showIf, n.hideIf, n.setsFlag]).filter(Boolean).map((f) => [f as string, true]))]) {
        expect(isWalkable(map, c.x, c.y, flags), `${c.mapId} ${c.x},${c.y}`).toBe(true);
      }
      expect(warpAt(map, c.x, c.y), c.mapId).toBeFalsy();
    }
  });
});
