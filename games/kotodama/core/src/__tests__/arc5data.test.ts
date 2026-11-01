import { describe, expect, it } from 'vitest';
import { KANJI, KANJI_LOOKALIKES, kanjiAt, kanjiByChar } from '../content/kanji';
import { VOCABULARY } from '../content/words';
import { PASSAGES } from '../content/passages';
import { CURRICULUM, areaIntroducingGroup } from '../content/curriculum';

const KANJI_CHAR = /[一-鿿]/;
const N3_AREAS = ['coast', 'glacier', 'forge', 'valor', 'runeforge'];
const order = Object.keys(CURRICULUM);

function untaught(text: string, area: string): string[] {
  return [...text].filter((c) => KANJI_CHAR.test(c)).filter((ch) => {
    const k = kanjiByChar(ch);
    return !k || order.indexOf(areaIntroducingGroup(k.group)!) > order.indexOf(area);
  });
}

describe('N3 data', () => {
  it('has ~150 N3 kanji, with characters and primary meanings unique across N5–N3', () => {
    expect(kanjiAt('N3').length).toBeGreaterThanOrEqual(140);
    expect(new Set(KANJI.map((k) => k.char)).size).toBe(KANJI.length);
    const primary = KANJI.map((k) => k.meanings[0]);
    const dupes = primary.filter((m, i) => primary.indexOf(m) !== i);
    expect(dupes).toEqual([]);
  });

  it('teaches the N3 groups in the Arc 5 areas, after every N4 area', () => {
    for (const k of kanjiAt('N3')) {
      const area = areaIntroducingGroup(k.group)!;
      expect(N3_AREAS, k.char).toContain(area);
      expect(order.indexOf(area)).toBeGreaterThan(order.indexOf('summit'));
    }
  });

  it('has ~100 N3 words, each using only taught kanji', () => {
    const n3 = VOCABULARY.filter((w) => N3_AREAS.includes(w.area));
    expect(n3.length).toBeGreaterThanOrEqual(100);
    for (const w of n3) expect(untaught(w.text, w.area), w.text).toEqual([]);
  });

  it('never lists a character twice in one look-alike group', () => {
    for (const g of KANJI_LOOKALIKES) expect(new Set(g).size, g.join('')).toBe(g.length);
  });
});

describe('N3 reading passages', () => {
  it('has ~20 passages with unique ids, an English question and four distinct choices', () => {
    expect(PASSAGES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(PASSAGES.map((p) => p.id)).size).toBe(PASSAGES.length);
    for (const p of PASSAGES) {
      expect(p.question, p.text).toMatch(/^[\x20-\x7e]+\?$/);
      expect(new Set([p.answer, ...p.wrong]).size, p.text).toBe(4);
      for (const c of [p.answer, ...p.wrong]) expect(c, p.text).toMatch(/^[\x20-\x7e]+$/);
    }
  });

  it('gives every Arc 5 area at least four passages', () => {
    for (const a of N3_AREAS) expect(PASSAGES.filter((p) => p.area === a).length, a).toBeGreaterThanOrEqual(4);
  });

  it("only uses kanji already taught by the passage's area", () => {
    for (const p of PASSAGES) expect(untaught(p.text, p.area), p.text).toEqual([]);
  });

  it('keeps every passage short: two or three sentences', () => {
    for (const p of PASSAGES) {
      const sentences = p.text.split('。').filter(Boolean).length;
      expect(sentences, p.text).toBeGreaterThanOrEqual(2);
      expect(sentences, p.text).toBeLessThanOrEqual(3);
    }
  });
});
