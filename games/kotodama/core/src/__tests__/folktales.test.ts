import { describe, expect, it } from 'vitest';
import { FOLK_SITES, getMap, getTale, sceneMapId, signpostId, ALL_MAPS } from '../index';

// Kana pages: hiragana and katakana, spaces, punctuation and quotes. No kanji.
const KANA = /^[ぁ-ゖァ-ヺー・ 、。！？「」…]+$/;

describe('folk tale sites', () => {
  it('every tale reads in kana, has a kanji version and English on every page', () => {
    for (const { tale } of FOLK_SITES) {
      expect(tale.pages.length, tale.id).toBeGreaterThanOrEqual(4);
      for (const p of tale.pages) {
        expect(p.ja, `${tale.id}: ${p.ja}`).toMatch(KANA);
        expect(p.kanji, tale.id).toBeTruthy();
        expect(p.kanji, `${tale.id}: kanji text has no spaces`).not.toMatch(/ /);
        expect(p.en.length, tale.id).toBeGreaterThan(10);
      }
      expect(getTale(tale.id)).toBe(tale);
    }
  });

  it('never repeats a tale, a place or a unique look', () => {
    const ids = FOLK_SITES.map((s) => s.tale.id);
    const places = FOLK_SITES.map((s) => s.place);
    const looks = FOLK_SITES.flatMap((s) => [s.heart, ...s.people]).map((p) => p.sprite).filter((k) => k.startsWith('folk:'));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(places).size).toBe(places.length);
    expect(new Set(looks).size).toBe(looks.length);
  });

  it('every tale has a signpost on its host and a scene with its board and people', () => {
    for (const s of FOLK_SITES) {
      const host = getMap(s.host);
      const post = host.def.npcs.find((n) => n.id === signpostId(s.tale.id));
      expect(post?.travelsTo?.map, s.tale.id).toBe(sceneMapId(s.tale.id));
      const scene = getMap(sceneMapId(s.tale.id));
      expect(scene.def.npcs.find((n) => n.readsTale === s.tale.id), s.tale.id).toBeDefined();
      expect(scene.def.npcs.length).toBe(2 + Math.min(3, s.people.length));
      expect(s.people.length, s.tale.id).toBeLessThanOrEqual(3);
      expect(scene.def.warps[0]?.to).toBe(s.host);
    }
    expect(ALL_MAPS.length).toBeGreaterThan(FOLK_SITES.length);
  });
});
