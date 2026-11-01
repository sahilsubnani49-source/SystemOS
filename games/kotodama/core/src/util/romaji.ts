import { KANA } from '../content/kana';

// Kana → wāpuro romaji (doubled long vowels: こう = kou, コーヒー = koohii). Used to
// derive every reading's romaji from its kana, so romaji is never hand-typed for
// kanji or vocabulary.

/** Small-vowel combinations used in loanwords (ウェ, ファ, ティ...). */
const EXTENDED: Record<string, string> = {
  ウィ: 'wi', ウェ: 'we', ウォ: 'wo', ファ: 'fa', フィ: 'fi', フェ: 'fe', フォ: 'fo',
  ティ: 'ti', ディ: 'di', トゥ: 'tu', ドゥ: 'du', ジェ: 'je', チェ: 'che', シェ: 'she', ヴ: 'vu',
};

const TABLE = new Map<string, string>([
  ...KANA.map((k) => [k.char, k.romaji] as [string, string]),
  ...Object.entries(EXTENDED),
]);

const SOKUON = new Set(['っ', 'ッ']);

/** Hiragana ↔ katakana by code point (on'yomi are stored in katakana). */
export function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export function toRomaji(kana: string): string {
  const chars = [...kana];
  let out = '';
  let doubleNext = false;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i] as string;
    if (SOKUON.has(c)) {
      doubleNext = true;
      continue;
    }
    if (c === 'ー') {
      out += out.slice(-1); // stretch the previous vowel
      continue;
    }
    const pair = c + (chars[i + 1] ?? '');
    let r = TABLE.get(pair);
    if (r) i++;
    else r = TABLE.get(c);
    if (r === undefined) throw new Error(`toRomaji: no romaji for '${c}' in '${kana}'`);
    if (doubleNext) {
      // っち → tchi (Hepburn); otherwise double the first consonant.
      out += r.startsWith('ch') ? 't' : r[0];
      doubleNext = false;
    }
    out += r;
  }
  return out;
}
