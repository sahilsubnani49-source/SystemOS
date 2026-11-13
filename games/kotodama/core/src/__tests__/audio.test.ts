import { describe, expect, it } from 'vitest';
import { DEFAULT_AUDIO, SCREEN_MUSIC, audioSettings, musicSlotFor, stepVolume } from '../save/audio';
import { ALL_MAPS } from '../world/maps';

describe('sound settings', () => {
  it('gives old saves the defaults', () => {
    expect(audioSettings(null)).toEqual(DEFAULT_AUDIO);
    expect(audioSettings({})).toEqual(DEFAULT_AUDIO);
  });

  it('keeps what the player chose and clamps nonsense', () => {
    expect(audioSettings({ audio: { musicVolume: 0.2, musicMuted: true } })).toMatchObject({ musicVolume: 0.2, musicMuted: true, sfxVolume: DEFAULT_AUDIO.sfxVolume });
    expect(audioSettings({ audio: { musicVolume: 7, sfxVolume: -1 } })).toMatchObject({ musicVolume: 1, sfxVolume: 0 });
    expect(audioSettings({ audio: { musicVolume: Number.NaN } }).musicVolume).toBe(DEFAULT_AUDIO.musicVolume);
  });

  it('steps volume a notch at a time and stops at both ends', () => {
    expect(stepVolume(0.5, 1)).toBe(0.6);
    expect(stepVolume(0.5, -1)).toBe(0.4);
    expect(stepVolume(1, 1)).toBe(1);
    expect(stepVolume(0, -1)).toBe(0);
    let v = 0;
    for (let i = 0; i < 10; i++) v = stepVolume(v, 1);
    expect(v).toBe(1);
  });
});

describe('which music plays', () => {
  it('follows the screen', () => {
    expect(musicSlotFor({ screen: 'boot' })).toBeNull();
    expect(musicSlotFor({ screen: 'title' })).toBe(SCREEN_MUSIC.title);
    expect(musicSlotFor({ screen: 'heroSelect' })).toBe(SCREEN_MUSIC.title);
    expect(musicSlotFor({ screen: 'world', mapMusic: 'village' })).toBe('village');
  });

  it('puts battles above the menu and the menu above the map', () => {
    expect(musicSlotFor({ screen: 'world', mapMusic: 'village', menuOpen: true })).toBe(SCREEN_MUSIC.menu);
    expect(musicSlotFor({ screen: 'battle', mapMusic: 'village', battle: { isBoss: false }, menuOpen: true })).toBe(SCREEN_MUSIC.wildBattle);
    expect(musicSlotFor({ screen: 'battle', mapMusic: 'boss', battle: { isBoss: true } })).toBe(SCREEN_MUSIC.bossBattle);
  });

  it('knows every slot a map asks for', () => {
    // Mirrors TRACKS in game/src/audio/music.ts: a new map slot needs a track there too.
    const tracks = new Set(['boss', 'castle', 'cave', 'caves', 'docks', 'dojo', 'forest', 'garden', 'harbor', 'hideout', 'keep', 'longhouse', 'market', 'mountain', 'river', 'shore', 'shrine', 'teahouse', 'temple', 'tower', 'village']);
    expect([...new Set(ALL_MAPS.map((m) => m.music))].filter((slot) => !tracks.has(slot))).toEqual([]);
  });
});
