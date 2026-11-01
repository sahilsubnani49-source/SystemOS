import { describe, expect, it } from 'vitest';
import { ALL_MAPS, getMap } from '../world/maps';
import { TILE_PROPS, tileAt, visibleNpcs, warpAt, type ParsedMap } from '../world/types';
import { CURRICULUM } from '../content/curriculum';
import { getFamily } from '../content/spirits';
import { START_MAP, START_POS } from '../save/schema';

const walkableTile = (m: ParsedMap, x: number, y: number) => !TILE_PROPS[tileAt(m, x, y)].solid;

/** Every flag a full playthrough sets, to explore the "everything unlocked" world. */
const ALL_FLAGS = Object.fromEntries(
  ALL_MAPS.flatMap((d) => d.npcs.flatMap((n) => [n.setsFlag, n.battle?.winFlag])).filter(Boolean).map((f) => [f, true]),
) as Record<string, boolean>;

/** Flood-fill tiles reachable on foot across warps, respecting NPCs and warp locks. */
function explore(flags: Record<string, boolean>) {
  const seen = new Set<string>();
  const queue: [string, number, number][] = [[START_MAP, START_POS.x, START_POS.y]];
  while (queue.length) {
    const [id, x, y] = queue.shift() as [string, number, number];
    const key = `${id}:${x}:${y}`;
    if (seen.has(key)) continue;
    const m = getMap(id);
    if (!walkableTile(m, x, y)) continue;
    if (visibleNpcs(m, flags).some((n) => n.x === x && n.y === y)) continue;
    seen.add(key);
    const warp = warpAt(m, x, y);
    if (warp && (!warp.requires || flags[warp.requires])) queue.push([warp.to, warp.toX, warp.toY]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) queue.push([id, x + dx, y + dy]);
  }
  return seen;
}

const canTalkTo = (reach: Set<string>, mapId: string, x: number, y: number) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has(`${mapId}:${x + (dx as number)}:${y + (dy as number)}`));

describe('Arc 1 maps', () => {
  it.each(ALL_MAPS.map((d) => [d.id]))('%s parses, and its warps, NPCs and spirits are valid', (id) => {
    const m = getMap(id);
    expect(CURRICULUM[m.def.area]).toBeDefined();
    for (const w of m.def.warps) {
      expect(walkableTile(m, w.x, w.y), `warp source ${w.x},${w.y} must be walkable`).toBe(true);
      const dest = getMap(w.to);
      expect(walkableTile(dest, w.toX, w.toY), `warp to ${w.to} ${w.toX},${w.toY} lands on a solid tile`).toBe(true);
      expect(warpAt(dest, w.toX, w.toY), `warp to ${w.to} lands on another warp`).toBeUndefined();
    }
    for (const n of m.def.npcs) {
      expect(walkableTile(m, n.x, n.y), `${n.id} stands on a solid tile`).toBe(true);
      n.battle?.foes.forEach((f) => expect(() => getFamily(f.familyId)).not.toThrow());
      if (n.battle?.pool) expect(CURRICULUM[n.battle.pool]).toBeDefined();
    }
    m.def.encounters.forEach((e) => expect(() => getFamily(e.familyId)).not.toThrow());
  });

  it('never shows two NPCs on the same tile at once', () => {
    for (const d of ALL_MAPS) {
      const m = getMap(d.id);
      for (const flags of [{}, ALL_FLAGS]) {
        const spots = visibleNpcs(m, flags).map((n) => `${n.x},${n.y}`);
        expect(new Set(spots).size, d.id).toBe(spots.length);
      }
    }
  });

  it('lets a new player reach Master Kaito but not leave the village', () => {
    const reach = explore({});
    expect(canTalkTo(reach, 'hayate_dojo', 6, 2)).toBe(true);
    expect([...reach].some((k) => k.startsWith('bamboo_grove:'))).toBe(false);
  });

  it('makes every map and every NPC reachable once the story is complete', () => {
    const reach = explore(ALL_FLAGS);
    for (const d of ALL_MAPS) {
      expect([...reach].some((k) => k.startsWith(`${d.id}:`)), `${d.id} unreachable`).toBe(true);
      for (const n of visibleNpcs(getMap(d.id), {})) {
        // NPCs hidden later still had to be reachable while they existed: check with
        // the flags their own story beat needs (everything except their own flags).
        const flags = { ...ALL_FLAGS };
        if (n.hideIf) delete flags[n.hideIf];
        if (n.battle) delete flags[n.battle.winFlag];
        expect(canTalkTo(explore(flags), d.id, n.x, n.y), `${d.id}/${n.id} unreachable`).toBe(true);
      }
    }
  });

  it('opens the story gates in order', () => {
    const story = ['starter', 'beat_goro', 'beat_bjorn', 'beat_shizuka', 'shrine_trial', 'beat_oni'];
    const reached = (flags: Record<string, boolean>, map: string) => [...explore(flags)].some((k) => k.startsWith(`${map}:`));
    const upTo = (i: number) => Object.fromEntries(story.slice(0, i).map((f) => [f, true]));
    expect(reached(upTo(1), 'bamboo_grove')).toBe(true);
    expect(reached(upTo(1), 'river_crossing')).toBe(false);
    expect(reached(upTo(2), 'river_crossing')).toBe(true);
    expect(reached(upTo(2), 'ninja_hideout')).toBe(false);
    expect(reached(upTo(3), 'ninja_hideout')).toBe(true);
    expect(reached(upTo(3), 'mountain_pass')).toBe(false);
    expect(reached(upTo(4), 'moon_shrine')).toBe(true);
    expect(reached(upTo(4), 'broken_gate')).toBe(false);
    expect(reached(upTo(5), 'broken_gate')).toBe(true);
  });
});
