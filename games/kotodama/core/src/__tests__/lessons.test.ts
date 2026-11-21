import { describe, expect, it } from 'vitest';
import { CURRICULUM, lessonFor } from '../index';

describe('lesson scrolls', () => {
  it('every curriculum area has a scroll with something on it', () => {
    for (const id of Object.keys(CURRICULUM)) {
      const l = lessonFor(id);
      expect(l, id).not.toBeNull();
      expect(l!.sections.length, id).toBeGreaterThan(0);
    }
  });

  it('teaches only what is new: the K-row scroll has no vowels', () => {
    const chars = lessonFor('bamboo')!.sections.flatMap((s) => s.rows.map((r) => r.ja));
    expect(chars).toContain('か');
    expect(chars).not.toContain('あ');
  });

  it('kanji rows carry the reading the battles ask for', () => {
    const castle = lessonFor('castle')!;
    const kanji = castle.sections.find((s) => s.heading === 'KANJI');
    expect(kanji?.rows.length).toBeGreaterThan(0);
    for (const r of kanji!.rows) expect(r.sub).toMatch(/^[ぁ-ゖー]+$/);
  });

  it('unknown areas (the Daily Trial) have no scroll', () => {
    expect(lessonFor('review')).toBeNull();
  });
});
