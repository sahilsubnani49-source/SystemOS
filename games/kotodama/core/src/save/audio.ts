import type { Save } from './schema';

// Sound settings and the rule for which music plays. Pure, so both are tested;
// the player itself lives in the renderer (game/src/audio/music.ts).

export interface AudioSettings {
  /** 0 to 1. */
  musicVolume: number;
  musicMuted: boolean;
  /** 0 to 1. */
  sfxVolume: number;
  sfxMuted: boolean;
}

/** Music sits under the voice by default: this is a listening game. */
export const DEFAULT_AUDIO: AudioSettings = { musicVolume: 0.5, musicMuted: false, sfxVolume: 0.8, sfxMuted: false };

/** The menu moves a volume one notch at a time. */
export const VOLUME_STEPS = 10;

const clamp01 = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback);

/** A save's sound settings, with defaults for saves written before there was sound. */
export function audioSettings(save: Pick<Save, 'audio'> | null | undefined): AudioSettings {
  const a = save?.audio ?? {};
  return {
    musicVolume: clamp01(a.musicVolume, DEFAULT_AUDIO.musicVolume),
    musicMuted: a.musicMuted === true,
    sfxVolume: clamp01(a.sfxVolume, DEFAULT_AUDIO.sfxVolume),
    sfxMuted: a.sfxMuted === true,
  };
}

/** One notch up or down, snapped to the notches so repeated taps cannot drift. */
export function stepVolume(volume: number, dir: 1 | -1): number {
  const notch = Math.round(clamp01(volume, 0) * VOLUME_STEPS) + dir;
  return Math.min(VOLUME_STEPS, Math.max(0, notch)) / VOLUME_STEPS;
}

/** Tracks that belong to a screen, not to a map. */
export const SCREEN_MUSIC = { title: 'title', wildBattle: 'wild_battle', bossBattle: 'boss_battle', menu: 'menu' } as const;

export interface MusicScene {
  screen: 'boot' | 'title' | 'heroSelect' | 'world' | 'battle';
  /** The current map's `music` slot (world and battle). */
  mapMusic?: string;
  /** A battle is open, and whether it is a boss or exam. */
  battle?: { isBoss: boolean } | null;
  menuOpen?: boolean;
}

/**
 * The music slot for what is on screen, or null for silence. A battle outranks
 * the menu, the menu outranks the map.
 */
export function musicSlotFor(scene: MusicScene): string | null {
  if (scene.screen === 'boot') return null;
  if (scene.screen === 'title' || scene.screen === 'heroSelect') return SCREEN_MUSIC.title;
  if (scene.screen === 'battle' || scene.battle) return scene.battle?.isBoss ? SCREEN_MUSIC.bossBattle : SCREEN_MUSIC.wildBattle;
  if (scene.menuOpen) return SCREEN_MUSIC.menu;
  return scene.mapMusic ?? null;
}
