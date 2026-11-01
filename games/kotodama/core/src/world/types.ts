import type { Rng } from '../util/rng';

export type TileKind =
  | 'grass' | 'tallGrass' | 'path' | 'water' | 'deepWater' | 'sand' | 'tree' | 'bamboo'
  | 'rock' | 'wall' | 'roof' | 'floor' | 'door' | 'bridge' | 'flower' | 'torii' | 'fence'
  | 'lantern' | 'sakura' | 'tatami' | 'snow' | 'void'
  // Arc 2 (Frost Harbor)
  | 'ice' | 'drift' | 'dock' | 'pine' | 'snowPine' | 'longhouseWall' | 'longhouseRoof' | 'runestone' | 'hull';

export interface TileProps {
  solid: boolean;
  /** Wild Kotodama can appear when you step here. */
  encounter: boolean;
  /** Renderer animates this tile (water shimmer, swaying grass). */
  animated: boolean;
}

export const TILE_PROPS: Record<TileKind, TileProps> = {
  grass: { solid: false, encounter: false, animated: false },
  tallGrass: { solid: false, encounter: true, animated: true },
  path: { solid: false, encounter: false, animated: false },
  water: { solid: true, encounter: false, animated: true },
  deepWater: { solid: true, encounter: false, animated: true },
  sand: { solid: false, encounter: false, animated: false },
  tree: { solid: true, encounter: false, animated: false },
  bamboo: { solid: false, encounter: true, animated: true },
  rock: { solid: true, encounter: false, animated: false },
  wall: { solid: true, encounter: false, animated: false },
  roof: { solid: true, encounter: false, animated: false },
  floor: { solid: false, encounter: false, animated: false },
  door: { solid: false, encounter: false, animated: false },
  bridge: { solid: false, encounter: false, animated: false },
  flower: { solid: false, encounter: false, animated: true },
  torii: { solid: true, encounter: false, animated: false },
  fence: { solid: true, encounter: false, animated: false },
  lantern: { solid: true, encounter: false, animated: true },
  sakura: { solid: true, encounter: false, animated: true },
  tatami: { solid: false, encounter: false, animated: false },
  snow: { solid: false, encounter: false, animated: false },
  void: { solid: true, encounter: false, animated: false },
  ice: { solid: false, encounter: false, animated: true },
  /** Deep snow: Arc 2's tall grass. Wild spirits lurk here. */
  drift: { solid: false, encounter: true, animated: true },
  dock: { solid: false, encounter: false, animated: false },
  pine: { solid: true, encounter: false, animated: false },
  snowPine: { solid: true, encounter: false, animated: false },
  longhouseWall: { solid: true, encounter: false, animated: false },
  longhouseRoof: { solid: true, encounter: false, animated: false },
  runestone: { solid: true, encounter: false, animated: false },
  hull: { solid: true, encounter: false, animated: false },
};

/** One character per tile in a map's ASCII rows. */
export const DEFAULT_LEGEND: Record<string, TileKind> = {
  '.': 'grass', ',': 'tallGrass', '=': 'path', '~': 'water', 'W': 'deepWater', 's': 'sand',
  'T': 'tree', 'B': 'bamboo', 'o': 'rock', '#': 'wall', '^': 'roof', '_': 'floor', 'D': 'door',
  'H': 'bridge', '*': 'flower', 'I': 'torii', '|': 'fence', 'L': 'lantern', 'S': 'sakura',
  't': 'tatami', 'n': 'snow', ' ': 'void',
  // Arc 2
  'i': 'ice', 'f': 'drift', 'd': 'dock', 'p': 'pine', 'P': 'snowPine', 'w': 'longhouseWall',
  'R': 'longhouseRoof', 'r': 'runestone', 'k': 'hull',
};

export type Facing = 'up' | 'down' | 'left' | 'right';
export type Weather = 'none' | 'sakura' | 'fireflies' | 'rain' | 'snow';

export interface Warp {
  x: number;
  y: number;
  to: string;
  toX: number;
  toY: number;
  /** Flag required to pass; otherwise `lockedText` is shown. */
  requires?: string;
  lockedText?: string;
}

export interface DialogueLine {
  speaker?: string;
  text: string;
  /** Optional Japanese line shown above the English, with its reading. */
  ja?: string;
}

export interface FoeSpec {
  familyId: string;
  level: number;
  /** Override the displayed name (bosses, named raiders). */
  name?: string;
  nameJa?: string;
  sprite?: string;
  /** Boss/trainer foes can't be purified. */
  recruitable?: boolean;
  hpScale?: number;
}

export interface NpcDef {
  id: string;
  x: number;
  y: number;
  sprite: string;
  facing: Facing;
  dialogue: DialogueLine[];
  /** Dialogue after `battle` is won. */
  afterDialogue?: DialogueLine[];
  battle?: { foes: FoeSpec[]; isBoss?: boolean; winFlag: string; pool?: string };
  /** Shown only while this flag is unset / set. */
  hideIf?: string;
  showIf?: string;
  /** Talking sets this flag (gifts, quest steps). */
  setsFlag?: string;
  /** Heals the party (dojo masters, shrine maidens). */
  heals?: boolean;
  /** Talking adds this spirit to the party (once, guarded by `setsFlag`). */
  givesSpirit?: { familyId: string; level: number };
  /** Talking grants the warhorse (guarded by `setsFlag`). */
  givesHorse?: boolean;
  /** Display name over the dialogue box. */
  name?: string;
  /** Talking carries the player to another map (ferries between arcs). */
  travelsTo?: { map: string; x: number; y: number };
}

export interface EncounterEntry {
  familyId: string;
  weight: number;
  levels: [number, number];
}

export interface MapDef {
  id: string;
  name: string;
  nameJa: string;
  /** Curriculum area: decides which kana this map's battles test. */
  area: string;
  rows: string[];
  legend?: Record<string, TileKind>;
  warps: Warp[];
  npcs: NpcDef[];
  encounterRate: number;
  encounters: EncounterEntry[];
  music: string;
  weather: Weather;
  /** Horse riding allowed (outdoors). */
  rideable: boolean;
  /** Night tint strength 0..1 (caves, hideouts). */
  darkness?: number;
}

export interface ParsedMap {
  def: MapDef;
  width: number;
  height: number;
  tiles: TileKind[];
}

export function parseMap(def: MapDef): ParsedMap {
  const legend = { ...DEFAULT_LEGEND, ...(def.legend ?? {}) };
  const height = def.rows.length;
  const width = def.rows[0]?.length ?? 0;
  const tiles: TileKind[] = [];
  def.rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`${def.id}: row ${y} is ${row.length} wide, expected ${width}`);
    for (const ch of row) {
      const kind = legend[ch];
      if (!kind) throw new Error(`${def.id}: unknown tile '${ch}' on row ${y}`);
      tiles.push(kind);
    }
  });
  return { def, width, height, tiles };
}

export function tileAt(map: ParsedMap, x: number, y: number): TileKind {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return 'void';
  return map.tiles[y * map.width + x] as TileKind;
}

/** NPCs that exist given the current flags. */
export function visibleNpcs(map: ParsedMap, flags: Record<string, boolean>): NpcDef[] {
  return map.def.npcs.filter((n) => (!n.hideIf || !flags[n.hideIf]) && (!n.showIf || flags[n.showIf]));
}

export function isWalkable(map: ParsedMap, x: number, y: number, flags: Record<string, boolean>): boolean {
  if (TILE_PROPS[tileAt(map, x, y)].solid) return false;
  return !visibleNpcs(map, flags).some((n) => n.x === x && n.y === y);
}

export function step(x: number, y: number, facing: Facing): [number, number] {
  switch (facing) {
    case 'up': return [x, y - 1];
    case 'down': return [x, y + 1];
    case 'left': return [x - 1, y];
    case 'right': return [x + 1, y];
  }
}

export function warpAt(map: ParsedMap, x: number, y: number): Warp | undefined {
  return map.def.warps.find((w) => w.x === x && w.y === y);
}

/** Roll for a wild encounter after stepping onto (x, y). Riding halves the rate. */
export function rollEncounter(map: ParsedMap, x: number, y: number, rng: Rng, riding: boolean): EncounterEntry | null {
  if (!TILE_PROPS[tileAt(map, x, y)].encounter || map.def.encounters.length === 0) return null;
  const rate = riding ? map.def.encounterRate / 2 : map.def.encounterRate;
  if (rng.next() >= rate) return null;
  const total = map.def.encounters.reduce((s, e) => s + e.weight, 0);
  let roll = rng.next() * total;
  for (const e of map.def.encounters) {
    roll -= e.weight;
    if (roll < 0) return e;
  }
  return map.def.encounters[map.def.encounters.length - 1] ?? null;
}
