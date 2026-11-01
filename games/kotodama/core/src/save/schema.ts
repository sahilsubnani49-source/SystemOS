import type { HeroClass } from '../content/heroes';
import type { SrsTable } from '../srs/schedule';
import type { Facing } from '../world/types';

export const SAVE_VERSION = 1;

export interface OwnedSpirit {
  uid: string;
  familyId: string;
  level: number;
  xp: number;
}

export interface SaveV1 {
  version: 1;
  createdAt: string;
  hero: HeroClass;
  playerName: string;
  heroLevel: number;
  heroXp: number;
  mapId: string;
  x: number;
  y: number;
  facing: Facing;
  /** Battle team (max PARTY_SIZE spirits fight beside the hero). */
  party: OwnedSpirit[];
  /** Recruited spirits not in the team. */
  box: OwnedSpirit[];
  flags: Record<string, boolean>;
  gold: number;
  items: Record<string, number>;
  horse: { owned: boolean; name: string; riding: boolean };
  dex: { seen: string[]; caught: string[] };
  srs: SrsTable;
  /** Local YYYY-MM-DD of the last session; drives the study streak and horse bond. */
  lastPlayedDate: string | null;
  streakDays: number;
  playSeconds: number;
  /** RNG state for overworld encounters, so reloading can't re-roll them. */
  seed: number;
}

export type Save = SaveV1;

export const PARTY_SIZE = 2;
export const START_MAP = 'hayate_dojo';
export const START_POS = { x: 7, y: 9 } as const;

export function newGame(hero: HeroClass, playerName: string, createdAt: string, seed: number): Save {
  return {
    version: 1,
    createdAt,
    hero,
    playerName: playerName.trim().slice(0, 12) || 'Scribe',
    heroLevel: 1,
    heroXp: 0,
    mapId: START_MAP,
    x: START_POS.x,
    y: START_POS.y,
    facing: 'up',
    party: [],
    box: [],
    flags: {},
    gold: 50,
    items: { onigiri: 3 },
    horse: { owned: false, name: 'Hayate', riding: false },
    dex: { seen: [], caught: [] },
    srs: {},
    lastPlayedDate: null,
    streakDays: 0,
    playSeconds: 0,
    seed: seed >>> 0,
  };
}

/**
 * Bring any stored save up to the current version. Returns null for data that
 * isn't a save at all, so a corrupt file starts a new game instead of crashing.
 * Each future version adds one `if (v === n)` step here; never edit an old step.
 */
export function migrateSave(raw: unknown): Save | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  if (data.version === 1) {
    if (typeof data.hero !== 'string' || typeof data.mapId !== 'string') return null;
    const fresh = newGame(data.hero as HeroClass, String(data.playerName ?? ''), String(data.createdAt ?? ''), 1);
    // Defaults first so a save written by an older build gains any newly-added field.
    return { ...fresh, ...(data as Partial<Save>), version: 1 } as Save;
  }
  return null;
}
