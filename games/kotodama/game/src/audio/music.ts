import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { DEFAULT_AUDIO, type AudioSettings } from '@kotodama/core';

// Background music and sound effects (the "Terakoya Study Lo-Fi" pack).
//
// Music: one looping track at a time, named after the music slot a map already
// carries (`MapDef.music`) or a screen slot (title, wild_battle, boss_battle,
// menu). `musicSlotFor` in @kotodama/core decides WHICH slot; this file only
// plays it. Each file is the pack's short loop repeated to about a minute, so the
// player's small restart gap comes round rarely.
//
// The music steps back while Japanese is being spoken (`duckMusic`): hearing the
// voice is the point of the game.
//
// Everything fails quietly. A device or build without audio just stays silent.

/* eslint-disable @typescript-eslint/no-require-imports */
const TRACKS: Record<string, number> = {
  title: require('../../assets/audio/music/title.m4a'),
  menu: require('../../assets/audio/music/menu.m4a'),
  wild_battle: require('../../assets/audio/music/wild_battle.m4a'),
  boss_battle: require('../../assets/audio/music/boss_battle.m4a'),
  boss: require('../../assets/audio/music/boss.m4a'),
  castle: require('../../assets/audio/music/castle.m4a'),
  cave: require('../../assets/audio/music/cave.m4a'),
  caves: require('../../assets/audio/music/caves.m4a'),
  docks: require('../../assets/audio/music/docks.m4a'),
  dojo: require('../../assets/audio/music/dojo.m4a'),
  forest: require('../../assets/audio/music/forest.m4a'),
  garden: require('../../assets/audio/music/garden.m4a'),
  harbor: require('../../assets/audio/music/harbor.m4a'),
  hideout: require('../../assets/audio/music/hideout.m4a'),
  keep: require('../../assets/audio/music/keep.m4a'),
  longhouse: require('../../assets/audio/music/longhouse.m4a'),
  market: require('../../assets/audio/music/market.m4a'),
  mountain: require('../../assets/audio/music/mountain.m4a'),
  river: require('../../assets/audio/music/river.m4a'),
  shore: require('../../assets/audio/music/shore.m4a'),
  shrine: require('../../assets/audio/music/shrine.m4a'),
  teahouse: require('../../assets/audio/music/teahouse.m4a'),
  temple: require('../../assets/audio/music/temple.m4a'),
  tower: require('../../assets/audio/music/tower.m4a'),
  village: require('../../assets/audio/music/village.m4a'),
};

const SFX = {
  menuClick: require('../../assets/audio/sfx/sfx_menu_click.wav'),
  talk: require('../../assets/audio/sfx/sfx_talk_confirm.wav'),
  correct: require('../../assets/audio/sfx/sfx_quiz_correct.wav'),
  wrong: require('../../assets/audio/sfx/sfx_quiz_wrong.wav'),
  slash: require('../../assets/audio/sfx/sfx_katana_slash.wav'),
  focus: require('../../assets/audio/sfx/sfx_focus_charge.wav'),
  capture: require('../../assets/audio/sfx/sfx_spirit_capture.wav'),
  shard: require('../../assets/audio/sfx/sfx_runestone_shard.wav'),
  starSolve: require('../../assets/audio/sfx/sfx_jlpt_star_solve.wav'),
  bossEncounter: require('../../assets/audio/sfx/sfx_boss_encounter.wav'),
  clack: require('../../assets/audio/sfx/sfx_hyoshigi_clack.wav'),
  taiko: require('../../assets/audio/sfx/sfx_wano_taiko.wav'),
} as const;
/* eslint-enable @typescript-eslint/no-require-imports */

export type SfxId = keyof typeof SFX;

/** How far the music drops while a line is spoken. */
const DUCK = 0.3;

let settings: AudioSettings = DEFAULT_AUDIO;
let music: AudioPlayer | null = null;
/** The slot that should be sounding (null = silence). */
let wanted: string | null = null;
/** The slot loaded in the player right now. */
let loaded: string | null = null;
let paused = false;
let duckedUntil = 0;
let duckTimer: ReturnType<typeof setTimeout> | null = null;
const sfxPlayers = new Map<SfxId, AudioPlayer>();

const quiet = (fn: () => void) => {
  try {
    fn();
  } catch {
    // no audio on this device or build
  }
};

function musicLevel(): number {
  if (settings.musicMuted) return 0;
  return settings.musicVolume * (Date.now() < duckedUntil ? DUCK : 1);
}

/** Bring the player in line with `wanted`, the settings and the pause state. */
function sync() {
  quiet(() => {
    const audible = wanted !== null && !paused && !settings.musicMuted && settings.musicVolume > 0;
    if (!audible) {
      music?.pause();
      return;
    }
    const track = TRACKS[wanted as string];
    if (track === undefined) {
      music?.pause();
      return;
    }
    if (!music) {
      music = createAudioPlayer(track);
      loaded = wanted;
    } else if (loaded !== wanted) {
      music.replace(track);
      loaded = wanted;
    }
    music.loop = true;
    music.volume = musicLevel();
    music.play();
  });
}

/** Play this slot's track on a loop (null stops the music). The same slot keeps playing. */
export function setMusic(slot: string | null) {
  if (slot === wanted) return;
  wanted = slot;
  sync();
}

/** Apply the player's sound settings (from the save, or straight from the menu). */
export function setAudioSettings(next: AudioSettings) {
  settings = next;
  sync();
  sfxPlayers.forEach((p) => quiet(() => (p.volume = next.sfxVolume)));
}

/** The app went to the background, or came back. */
export function pauseMusic(pause: boolean) {
  paused = pause;
  sync();
}

/** Lower the music for about this long, while a line of Japanese is spoken. */
export function duckMusic(ms: number) {
  duckedUntil = Math.max(duckedUntil, Date.now() + ms);
  quiet(() => {
    if (music) music.volume = musicLevel();
  });
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => quiet(() => {
    if (music) music.volume = musicLevel();
  }), duckedUntil - Date.now() + 30);
}

/** A one-shot sound over the music. */
export function playSfx(id: SfxId) {
  if (settings.sfxMuted || settings.sfxVolume <= 0 || paused) return;
  quiet(() => {
    let p = sfxPlayers.get(id);
    if (!p) {
      p = createAudioPlayer(SFX[id]);
      sfxPlayers.set(id, p);
    }
    p.volume = settings.sfxVolume;
    void p.seekTo(0);
    p.play();
  });
}

/** The game is closing (back to the host app): let go of every player. */
export function stopAllAudio() {
  wanted = null;
  loaded = null;
  quiet(() => music?.remove());
  music = null;
  sfxPlayers.forEach((p) => quiet(() => p.remove()));
  sfxPlayers.clear();
}

// Browsers refuse to start audio before the first tap or key press: try again then.
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  const wake = () => sync();
  document.addEventListener('pointerdown', wake, { once: true });
  document.addEventListener('keydown', wake, { once: true });
}
