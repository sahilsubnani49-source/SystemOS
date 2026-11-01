import { describe, expect, it } from 'vitest';
import { KANJI, KANJI_GROUPS, kanjiAt, kanjiByChar, kanjiGroupsAt, kanjiInGroup, kanjiReadings, primaryReading } from '../content/kanji';
import { LOANWORDS, VOCABULARY, WORDS } from '../content/words';
import { CURRICULUM, areaIntroducingGroup } from '../content/curriculum';
import { toHiragana, toRomaji } from '../util/romaji';

const HIRAGANA = /^[ぁ-ゖー]+$/;
const KATAKANA = /^[ァ-ヺー]+$/;
const KANJI_CHAR = /[一-鿿]/;

describe('romaji converter', () => {
  it('handles plain, combined, doubled and stretched sounds', () => {
    expect(toRomaji('がっこう')).toBe('gakkou');
    expect(toRomaji('きょう')).toBe('kyou');
    expect(toRomaji('いっしゅうかん')).toBe('isshuukan');
    expect(toRomaji('ホッチキス')).toBe('hotchikisu');
    expect(toRomaji('コーヒー')).toBe('koohii');
    expect(toRomaji('ノルウェー')).toBe('noruwee');
    expect(toHiragana('キュウ')).toBe('きゅう');
  });

  it('agrees with every hand-written loanword romaji (two independent sources)', () => {
    for (const w of LOANWORDS) expect(toRomaji(w.text), w.text).toBe(w.romaji);
  });
});

describe('N5 kanji data', () => {
  it('has 106 N5 + ~130 N4 unique kanji with unique primary meanings across both levels', () => {
    expect(kanjiAt('N5')).toHaveLength(106);
    expect(kanjiAt('N4').length).toBeGreaterThanOrEqual(125);
    expect(new Set(KANJI.map((k) => k.char)).size).toBe(KANJI.length);
    expect(new Set(KANJI.map((k) => k.meanings[0])).size).toBe(KANJI.length);
    expect(kanjiGroupsAt('N5')).toHaveLength(10);
    expect(kanjiGroupsAt('N4')).toHaveLength(11);
    for (const g of KANJI_GROUPS) expect(kanjiInGroup(g).length, g).toBeGreaterThanOrEqual(5);
  });

  it('stores on-yomi in katakana, kun-yomi in hiragana, and every reading converts to romaji', () => {
    for (const k of KANJI) {
      expect(k.on.length + k.kun.length, k.char).toBeGreaterThan(0);
      for (const on of k.on) expect(on, k.char).toMatch(KATAKANA);
      for (const kun of k.kun) expect(kun.replace('.', ''), k.char).toMatch(HIRAGANA);
      for (const r of kanjiReadings(k)) expect(() => toRomaji(r), `${k.char} ${r}`).not.toThrow();
      expect(primaryReading(k)).toMatch(HIRAGANA);
    }
  });
});

describe('N5 vocabulary', () => {
  it('has ~100 words, readings in hiragana, unique ids, spellings and meanings across ALL words', () => {
    expect(VOCABULARY.length).toBeGreaterThanOrEqual(95);
    for (const key of ['id', 'text', 'meaning'] as const) expect(new Set(WORDS.map((w) => w[key])).size, key).toBe(WORDS.length);
    for (const v of VOCABULARY) {
      expect(v.reading, v.text).toMatch(HIRAGANA);
      expect(v.text, v.text).toMatch(KANJI_CHAR);
      expect(v.romaji).toBe(toRomaji(v.reading));
    }
  });

  it("only uses kanji the player has already been taught by that word's area", () => {
    const order = Object.keys(CURRICULUM);
    for (const v of VOCABULARY) {
      for (const ch of [...v.text].filter((c) => KANJI_CHAR.test(c))) {
        const k = kanjiByChar(ch);
        expect(k, `${v.text} uses ${ch}, which is not in the N5 set`).toBeDefined();
        const introduced = areaIntroducingGroup(k!.group)!;
        expect(order.indexOf(introduced), `${v.text} (${v.area}) uses ${ch} from ${introduced}`).toBeLessThanOrEqual(order.indexOf(v.area));
      }
    }
  });
});
