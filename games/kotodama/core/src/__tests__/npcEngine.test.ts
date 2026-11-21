import { describe, expect, it } from 'vitest';
import {
  ALL_MAPS, createNpcWorld, getMap, npcFacePlayer, npcResume, tickNpcs, TILE_PROPS, tileAt, visibleNpcs, warpAt, type NpcWorld,
} from '../index';

const solid = (id: string, x: number, y: number) => TILE_PROPS[tileAt(getMap(id), x, y)].solid;

/** Where the player stands for the simulation: where some warp lands them on this map. */
function playerSpot(id: string) {
  const m = getMap(id);
  const taken = (x: number, y: number) => visibleNpcs(m, {}).some((n) => n.x === x && n.y === y);
  for (const d of ALL_MAPS) for (const w of d.warps) if (w.to === id && !taken(w.toX, w.toY)) return { x: w.toX, y: w.toY };
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) if (!solid(id, x, y) && !visibleNpcs(m, {}).some((n) => n.x === x && n.y === y)) return { x, y };
  throw new Error(id);
}

/** Tiles reachable on foot from `from`, with people standing on `blocked`. */
function flood(id: string, from: { x: number; y: number }, blocked: Set<string>) {
  const m = getMap(id);
  const seen = new Set<string>([`${from.x},${from.y}`]);
  const q = [from];
  for (let h = 0; h < q.length; h++) {
    const p = q[h] as { x: number; y: number };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = p.x + dx;
      const y = p.y + dy;
      const k = `${x},${y}`;
      if (x < 0 || y < 0 || x >= m.width || y >= m.height || seen.has(k) || solid(id, x, y) || blocked.has(k)) continue;
      seen.add(k);
      q.push({ x, y });
    }
  }
  return seen;
}

const occupied = (w: NpcWorld) => new Set(Object.values(w.actors).map((a) => `${a.x},${a.y}`));

describe('NPC movement engine', () => {
  it.each(ALL_MAPS.map((d) => [d.id]))('%s: people move without ever blocking a path', (id) => {
    const player = playerSpot(id);
    let world = createNpcWorld(id, {}, 0, 7);
    const home = flood(id, player, occupied(world));
    let moved = 0;
    for (let t = 1; t <= 600; t++) {
      const before = occupied(world);
      world = tickNpcs(world, { flags: {}, player, now: t * 150 });
      const actors = Object.values(world.actors);
      for (const a of actors) {
        expect(solid(id, a.x, a.y), `${a.id} on a solid tile`).toBe(false);
        if (a.x !== a.home.x || a.y !== a.home.y) {
          expect(warpAt(getMap(id), a.x, a.y), `${a.id} on a warp`).toBeUndefined();
          expect(Math.abs(a.x - a.home.x) + Math.abs(a.y - a.home.y), `${a.id} strayed`).toBeLessThanOrEqual(4);
          expect(a.behavior).toBe('wander');
        }
        expect(a.x === player.x && a.y === player.y, `${a.id} on the player`).toBe(false);
      }
      for (const a of actors)
        for (const b of actors)
          if (a.id < b.id && Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1) {
            const bothHome = a.x === a.home.x && a.y === a.home.y && b.x === b.home.x && b.y === b.home.y;
            expect(bothHome, `${a.id} and ${b.id} crowd each other`).toBe(true);
          }
      if (occupied(world).size && [...occupied(world)].some((k) => !before.has(k))) moved++;
      if (t % 50 === 0) {
        const now = flood(id, player, occupied(world));
        for (const k of home) if (!occupied(world).has(k)) expect(now.has(k), `${id}: tile ${k} cut off at tick ${t}`).toBe(true);
      }
    }
    const wanderers = Object.values(world.actors).filter((a) => a.behavior === 'wander').length;
    if (wanderers > 0) expect(moved, `${id}: nobody moved`).toBeGreaterThan(0);
  });

  it('people stop and face the player when spoken to, then carry on', () => {
    const id = 'sakura_village';
    let world = createNpcWorld(id, {}, 0, 3);
    const a = Object.values(world.actors).find((x) => x.behavior === 'wander')!;
    const player = { x: a.x, y: a.y + 1 };
    world = npcFacePlayer(world, a.id, player);
    expect(world.actors[a.id]?.facing).toBe('down');
    expect(world.actors[a.id]?.state).toBe('talk');
    const held = tickNpcs(world, { flags: {}, player, now: 99999 });
    expect(held.actors[a.id]?.x).toBe(a.x);
    world = npcResume(held, 100000);
    expect(world.actors[a.id]?.state).toBe('idle');
  });

  it('gives most of the world something to do', () => {
    // People only: boards, signposts and story objects are meant to stay put, and so are the
    // people marked stationary (healers, teachers, the Library's keepers) who keep a post.
    const people = ALL_MAPS.flatMap((d) => visibleNpcs(getMap(d.id), {}).filter((n) => !/^(board|signpost|prop:)/.test(n.sprite) && !n.stationary).map((n) => [d.id, n.id] as const));
    const wander = people.filter(([m, n]) => createNpcWorld(m, {}, 0).actors[n]?.behavior === 'wander').length;
    expect(wander / people.length).toBeGreaterThan(0.6);
  });
});
