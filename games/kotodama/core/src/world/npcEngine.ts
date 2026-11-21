import { createRng } from '../util/rng';
import { ALL_MAPS, getMap } from './maps';
import { ALL_CHECKPOINTS } from './checkpoints';
import { TILE_PROPS, tileAt, visibleNpcs, warpAt, type Facing, type NpcDef, type ParsedMap, type TileKind } from './types';

// The NPC movement engine: townspeople who walk about, go to work and stop to chat.
//
// Pure and deterministic, like the battle engine: `tickNpcs(world, ctx)` returns the
// next world, and the renderer only animates what changed. Nothing here is saved:
// when the player enters a map everyone starts at home again.
//
// The one rule that keeps the maps playable: a moving NPC only ever stands on a tile
// inside a fully open 3x3, and never right next to another NPC. A lone person in the
// middle of open ground can always be walked around, so no NPC can ever block a path.
// Anyone whose home is a narrow spot (a guard in a gateway, a ferryman on a pier) is
// taken to be standing there on purpose and only turns to look about.

export type NpcBehavior = 'still' | 'turn' | 'wander';

/** What someone is busy with, shown as a little bubble over their head. */
export type NpcTask =
  | 'fish' | 'sweep' | 'garden' | 'pray' | 'lantern' | 'read' | 'forge' | 'shop'
  | 'gather' | 'snow' | 'think' | 'sing' | 'chat' | 'rest' | 'look';

export interface NpcActor {
  id: string;
  x: number;
  y: number;
  facing: Facing;
  home: { x: number; y: number };
  behavior: NpcBehavior;
  state: 'idle' | 'walk' | 'task' | 'talk';
  /** Tiles still to walk, next first. */
  path: { x: number; y: number }[];
  task?: NpcTask;
  /** Game time (ms) of this actor's next decision or step. */
  nextAt: number;
}

export interface NpcWorld {
  mapId: string;
  actors: Record<string, NpcActor>;
  /** The engine's own RNG state: NPCs never touch the save's encounter rolls. */
  seed: number;
}

export interface NpcTickContext {
  flags: Record<string, boolean>;
  player: { x: number; y: number };
  now: number;
}

const STEP_MS = 420;
/** How far (in steps) a wanderer strays from home. */
const LEASH = 4;
const DIRS: [Facing, number, number][] = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];

/** Story objects that stay put; animals among the props get to roam. */
const ANIMALS = new Set(['dog', 'monkey', 'bear', 'hare', 'sparrow', 'crane', 'turtle', 'crab', 'mouse', 'cow', 'rooster', 'toad']);

// ── Map analysis (cached per map) ──────────────────────────────────────

interface MapInfo {
  /** Tiles a wanderer may stand on. */
  free: Set<string>;
  /** For each free tile, the job its surroundings suggest (and which way to face for it). */
  jobs: Map<string, { task: NpcTask; facing: Facing }>;
}

const key = (x: number, y: number) => `${x},${y}`;
const info = new Map<string, MapInfo>();

/** Where warps, ferries and defeat send the player: never stand there. */
function arrivalsInto(mapId: string): Set<string> {
  const out = new Set<string>();
  for (const d of ALL_MAPS) {
    for (const w of d.warps) if (w.to === mapId) out.add(key(w.toX, w.toY));
    for (const n of d.npcs) if (n.travelsTo?.map === mapId) out.add(key(n.travelsTo.x, n.travelsTo.y));
  }
  for (const c of ALL_CHECKPOINTS) if (c.mapId === mapId) out.add(key(c.x, c.y));
  return out;
}

const JOB_BY_TILE: Partial<Record<TileKind, NpcTask>> = {
  water: 'fish', deepWater: 'fish', dock: 'fish', flower: 'garden', sakura: 'garden', torii: 'pray',
  lantern: 'lantern', forgeFire: 'forge', noren: 'shop', tree: 'gather', pine: 'gather', bamboo: 'gather',
  snowPine: 'snow', runestone: 'read', waterfall: 'pray', tatami: 'sweep', floor: 'sweep',
};

function mapInfo(map: ParsedMap): MapInfo {
  const cached = info.get(map.def.id);
  if (cached) return cached;
  const solid = (x: number, y: number) => TILE_PROPS[tileAt(map, x, y)].solid;
  const arrivals = arrivalsInto(map.def.id);
  const free = new Set<string>();
  const jobs = new Map<string, { task: NpcTask; facing: Facing }>();
  for (let y = 1; y < map.height - 1; y++)
    for (let x = 1; x < map.width - 1; x++) {
      let open = true;
      for (let dy = -1; dy <= 1 && open; dy++) for (let dx = -1; dx <= 1; dx++) if (solid(x + dx, y + dy)) open = false;
      if (!open || warpAt(map, x, y) || arrivals.has(key(x, y))) continue;
      free.add(key(x, y));
      // A job comes from the tile two steps away (the 3x3 around is open ground), or the floor itself.
      for (const [facing, dx, dy] of DIRS) {
        const job = JOB_BY_TILE[tileAt(map, x + dx * 2, y + dy * 2)];
        if (job) {
          jobs.set(key(x, y), { task: job, facing });
          break;
        }
      }
      if (!jobs.has(key(x, y))) {
        const floor = JOB_BY_TILE[tileAt(map, x, y)];
        if (floor) jobs.set(key(x, y), { task: floor === 'sweep' ? 'sweep' : floor, facing: 'down' });
      }
    }
  const made = { free, jobs };
  info.set(map.def.id, made);
  return made;
}

/** A job for someone standing at (x, y): from what is beside them, then a step further. */
function jobNear(map: ParsedMap, x: number, y: number): { task: NpcTask; facing: Facing } | undefined {
  for (const reach of [1, 2])
    for (const [facing, dx, dy] of DIRS) {
      const task = JOB_BY_TILE[tileAt(map, x + dx * reach, y + dy * reach)];
      if (task && task !== 'sweep') return { task, facing };
    }
  const floor = JOB_BY_TILE[tileAt(map, x, y)];
  return floor ? { task: floor, facing: 'down' } : undefined;
}

export function npcBehavior(npc: NpcDef, map: ParsedMap): NpcBehavior {
  if (npc.sprite === 'board' || npc.sprite === 'signpost') return 'still';
  if (npc.sprite.startsWith('prop:') && !ANIMALS.has(npc.sprite.slice(5))) return 'still';
  // Fighters, ferrymen and readers keep their post; so does anyone standing somewhere narrow.
  if (npc.battle || npc.travelsTo || npc.readsTale || npc.stationary) return 'turn';
  return mapInfo(map).free.has(key(npc.x, npc.y)) ? 'wander' : 'turn';
}

// ── World lifecycle ────────────────────────────────────────────────────

function actorFor(npc: NpcDef, map: ParsedMap, now: number, rng: () => number): NpcActor {
  return {
    id: npc.id, x: npc.x, y: npc.y, facing: npc.facing, home: { x: npc.x, y: npc.y },
    behavior: npcBehavior(npc, map), state: 'idle', path: [],
    // Stagger the first moves so a whole street does not set off at once.
    nextAt: now + 600 + Math.floor(rng() * 2500),
  };
}

export function createNpcWorld(mapId: string, flags: Record<string, boolean>, now: number, seed = 1): NpcWorld {
  const map = getMap(mapId);
  const rng = createRng(seed);
  const actors: Record<string, NpcActor> = {};
  for (const n of visibleNpcs(map, flags)) actors[n.id] = actorFor(n, map, now, rng.next);
  return { mapId, actors, seed: rng.seed };
}

/** Live positions by NPC id, for collisions and talking. */
export function npcPositions(world: NpcWorld | null): Record<string, { x: number; y: number }> | undefined {
  if (!world) return undefined;
  const out: Record<string, { x: number; y: number }> = {};
  for (const a of Object.values(world.actors)) out[a.id] = { x: a.x, y: a.y };
  return out;
}

/** Someone was spoken to: they turn to the player and wait until the talk is over. */
export function npcFacePlayer(world: NpcWorld, id: string, player: { x: number; y: number }): NpcWorld {
  const a = world.actors[id];
  if (!a || a.behavior === 'still') return world;
  const facing = faceToward(a, player);
  return { ...world, actors: { ...world.actors, [id]: { ...a, facing, state: 'talk', path: [], task: undefined } } };
}

/** The talk ended (or a menu closed): everyone waits a moment before moving on. */
export function npcResume(world: NpcWorld, now: number): NpcWorld {
  const actors: Record<string, NpcActor> = {};
  for (const a of Object.values(world.actors))
    actors[a.id] = a.state === 'talk' ? { ...a, state: 'idle', nextAt: now + 1500 } : { ...a, nextAt: Math.max(a.nextAt, now + 300) };
  return { ...world, actors };
}

// ── The tick ──────────────────────────────────────────────────────────

function faceToward(from: { x: number; y: number }, to: { x: number; y: number }): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

/** Tiles this actor may wander: free tiles within LEASH steps of home, by walking. */
function territory(a: NpcActor, free: Set<string>): Map<string, number> {
  const dist = new Map<string, number>([[key(a.home.x, a.home.y), 0]]);
  const queue = [a.home];
  for (let head = 0; head < queue.length; head++) {
    const p = queue[head] as { x: number; y: number };
    const d = dist.get(key(p.x, p.y)) as number;
    if (d >= LEASH) continue;
    for (const [, dx, dy] of DIRS) {
      const k = key(p.x + dx, p.y + dy);
      if (dist.has(k) || !free.has(k)) continue;
      dist.set(k, d + 1);
      queue.push({ x: p.x + dx, y: p.y + dy });
    }
  }
  return dist;
}

/** Shortest walk inside the territory (people are ignored: they move; we check each step). */
function pathTo(from: { x: number; y: number }, to: { x: number; y: number }, area: Map<string, number>): { x: number; y: number }[] {
  const prev = new Map<string, string | null>([[key(from.x, from.y), null]]);
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const p = queue[head] as { x: number; y: number };
    if (p.x === to.x && p.y === to.y) break;
    for (const [, dx, dy] of DIRS) {
      const n = { x: p.x + dx, y: p.y + dy };
      const k = key(n.x, n.y);
      if (prev.has(k) || !area.has(k)) continue;
      prev.set(k, key(p.x, p.y));
      queue.push(n);
    }
  }
  const out: { x: number; y: number }[] = [];
  let k: string | null | undefined = key(to.x, to.y);
  if (!prev.has(k)) return [];
  while (k && k !== key(from.x, from.y)) {
    const [x, y] = k.split(',').map(Number) as [number, number];
    out.unshift({ x, y });
    k = prev.get(k);
  }
  return out;
}

/** May `self` step onto (x, y) right now? */
function canEnter(world: NpcWorld, self: string, x: number, y: number, player: { x: number; y: number }): boolean {
  if (Math.abs(player.x - x) + Math.abs(player.y - y) <= 1) return false;
  for (const o of Object.values(world.actors)) {
    if (o.id === self) continue;
    if (Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1) return false;
  }
  return true;
}

const IDLE_TASKS: NpcTask[] = ['think', 'sing', 'rest', 'look'];

export function tickNpcs(world: NpcWorld, ctx: NpcTickContext): NpcWorld {
  const map = getMap(world.mapId);
  const { free, jobs } = mapInfo(map);
  const rng = createRng(world.seed);
  let actors = world.actors;

  // Keep the cast in line with the story: people appear and leave as flags change.
  const visible = visibleNpcs(map, ctx.flags);
  const ids = new Set(visible.map((n) => n.id));
  if (visible.some((n) => !actors[n.id]) || Object.keys(actors).some((id) => !ids.has(id))) {
    const next: Record<string, NpcActor> = {};
    for (const n of visible) next[n.id] = actors[n.id] ?? actorFor(n, map, ctx.now, rng.next);
    actors = next;
  }

  const out: NpcWorld = { ...world, actors: { ...actors } };
  const set = (a: NpcActor) => {
    out.actors[a.id] = a;
  };

  for (const a0 of Object.values(actors)) {
    let a = a0;
    if (a.behavior === 'still' || a.state === 'talk' || ctx.now < a.nextAt) continue;
    const near = Math.abs(a.x - ctx.player.x) + Math.abs(a.y - ctx.player.y);

    // Someone right beside the player stops and looks at them.
    if (near <= 1) {
      set({ ...a, facing: faceToward(a, ctx.player), state: 'idle', task: undefined, path: [], nextAt: ctx.now + 900 });
      continue;
    }

    // People at a post work where they stand: the ferryman fishes off his pier, the guard keeps watch.
    if (a.behavior === 'turn') {
      if (near <= 3) {
        set({ ...a, facing: faceToward(a, ctx.player), task: undefined, state: 'idle', nextAt: ctx.now + 1500 });
        continue;
      }
      const job = a.state !== 'task' && rng.next() < 0.55 ? jobNear(map, a.x, a.y) : undefined;
      if (job) set({ ...a, state: 'task', task: job.task, facing: job.facing, nextAt: ctx.now + 3500 + rng.int(0, 3500) });
      else if (a.state !== 'task' && rng.next() < 0.4) set({ ...a, state: 'task', task: rng.pick(['look', 'think', 'rest'] as NpcTask[]), nextAt: ctx.now + 2500 + rng.int(0, 2000) });
      else set({ ...a, state: 'idle', task: undefined, facing: rng.pick(DIRS)[0] as Facing, nextAt: ctx.now + 1800 + rng.int(0, 3200) });
      continue;
    }

    // Walking: take the next step if the way is clear; otherwise wait, and give up after a while.
    if (a.state === 'walk' && a.path.length > 0) {
      const step = a.path[0] as { x: number; y: number };
      if (canEnter(out, a.id, step.x, step.y, ctx.player)) {
        a = { ...a, x: step.x, y: step.y, facing: faceToward(a, step), path: a.path.slice(1), nextAt: ctx.now + STEP_MS };
        if (a.path.length === 0) a = arrive(a, jobs, out, rng, ctx.now);
        set(a);
      } else {
        const giveUp = rng.next() < 0.35;
        set(giveUp ? { ...a, state: 'idle', path: [], nextAt: ctx.now + 800 } : { ...a, nextAt: ctx.now + 500 });
      }
      continue;
    }

    // Idle or done with a task: choose what to do next.
    const area = territory(a, free);
    const spots = [...area.keys()].filter((k) => k !== key(a.x, a.y));
    if (spots.length === 0) {
      set({ ...a, facing: rng.pick(DIRS)[0] as Facing, nextAt: ctx.now + 2500 });
      continue;
    }
    const goHome = (a.x !== a.home.x || a.y !== a.home.y) && rng.next() < 0.25;
    // Work spots are twice as likely as plain ground: people go and DO things.
    const weighted = spots.flatMap((k) => (jobs.has(k) ? [k, k] : [k]));
    const target = goHome ? key(a.home.x, a.home.y) : rng.pick(weighted);
    const [tx, ty] = target.split(',').map(Number) as [number, number];
    const path = pathTo(a, { x: tx, y: ty }, area);
    if (path.length === 0) {
      set({ ...a, nextAt: ctx.now + 1500 });
      continue;
    }
    set({ ...a, state: 'walk', task: undefined, path, nextAt: ctx.now + 200 });
  }

  out.seed = rng.seed;
  return out;
}

/** Reached the end of a walk: start the job this spot suggests, or chat, or just idle. */
function arrive(a: NpcActor, jobs: MapInfo['jobs'], world: NpcWorld, rng: ReturnType<typeof createRng>, now: number): NpcActor {
  // Another idle person close by? Stop for a chat, facing them.
  const friend = Object.values(world.actors).find(
    (o) => o.id !== a.id && o.behavior !== 'still' && o.state !== 'walk' && Math.abs(o.x - a.x) + Math.abs(o.y - a.y) <= 2,
  );
  if (friend && rng.next() < 0.6) {
    return { ...a, state: 'task', task: 'chat', facing: faceToward(a, friend), nextAt: now + 2500 + rng.int(0, 2500) };
  }
  const job = jobs.get(key(a.x, a.y));
  if (job) return { ...a, state: 'task', task: job.task, facing: job.facing, nextAt: now + 3500 + rng.int(0, 3500) };
  if (rng.next() < 0.5) return { ...a, state: 'task', task: rng.pick(IDLE_TASKS), nextAt: now + 2000 + rng.int(0, 2000) };
  return { ...a, state: 'idle', task: undefined, nextAt: now + 800 + rng.int(0, 1600) };
}
