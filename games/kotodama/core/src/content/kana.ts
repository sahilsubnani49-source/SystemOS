// Every kana the game teaches. Ids are stable save-file keys: never rename one.
//   h-ka  = hiragana か      k-ka  = katakana カ
//   h-ga  = dakuten が       h-kya = combined sound (yōon) きゃ

export type Script = 'hiragana' | 'katakana';
export type KanaKind = 'basic' | 'dakuten' | 'yoon';
/** Gojūon row the kana belongs to ('a' row = vowels, 'n' = ん). */
export type KanaRow = 'a' | 'k' | 's' | 't' | 'n' | 'h' | 'm' | 'y' | 'r' | 'w' | 'nn';

export interface Kana {
  id: string;
  char: string;
  /** Canonical Hepburn romaji, shown as the answer. */
  romaji: string;
  /** Other spellings accepted when the player types (e.g. "si" for し). */
  alt: string[];
  script: Script;
  row: KanaRow;
  kind: KanaKind;
}


// [hiragana, katakana] per basic cell, row by row.
const BASIC: Record<KanaRow, [string, string, string, string[]?][]> = {
  a: [['あ', 'ア', 'a'], ['い', 'イ', 'i'], ['う', 'ウ', 'u'], ['え', 'エ', 'e'], ['お', 'オ', 'o']],
  k: [['か', 'カ', 'ka'], ['き', 'キ', 'ki'], ['く', 'ク', 'ku'], ['け', 'ケ', 'ke'], ['こ', 'コ', 'ko']],
  s: [['さ', 'サ', 'sa'], ['し', 'シ', 'shi', ['si']], ['す', 'ス', 'su'], ['せ', 'セ', 'se'], ['そ', 'ソ', 'so']],
  t: [['た', 'タ', 'ta'], ['ち', 'チ', 'chi', ['ti']], ['つ', 'ツ', 'tsu', ['tu']], ['て', 'テ', 'te'], ['と', 'ト', 'to']],
  n: [['な', 'ナ', 'na'], ['に', 'ニ', 'ni'], ['ぬ', 'ヌ', 'nu'], ['ね', 'ネ', 'ne'], ['の', 'ノ', 'no']],
  h: [['は', 'ハ', 'ha'], ['ひ', 'ヒ', 'hi'], ['ふ', 'フ', 'fu', ['hu']], ['へ', 'ヘ', 'he'], ['ほ', 'ホ', 'ho']],
  m: [['ま', 'マ', 'ma'], ['み', 'ミ', 'mi'], ['む', 'ム', 'mu'], ['め', 'メ', 'me'], ['も', 'モ', 'mo']],
  y: [['や', 'ヤ', 'ya'], ['ゆ', 'ユ', 'yu'], ['よ', 'ヨ', 'yo']],
  r: [['ら', 'ラ', 'ra'], ['り', 'リ', 'ri'], ['る', 'ル', 'ru'], ['れ', 'レ', 're'], ['ろ', 'ロ', 'ro']],
  w: [['わ', 'ワ', 'wa'], ['を', 'ヲ', 'wo', ['o']]],
  nn: [['ん', 'ン', 'n', ['nn']]],
};

// Voiced (dakuten) and half-voiced (handakuten) sounds, filed under their base row.
const DAKUTEN: [string, string, string, KanaRow, string[]?][] = [
  ['が', 'ガ', 'ga', 'k'], ['ぎ', 'ギ', 'gi', 'k'], ['ぐ', 'グ', 'gu', 'k'], ['げ', 'ゲ', 'ge', 'k'], ['ご', 'ゴ', 'go', 'k'],
  ['ざ', 'ザ', 'za', 's'], ['じ', 'ジ', 'ji', 's', ['zi']], ['ず', 'ズ', 'zu', 's'], ['ぜ', 'ゼ', 'ze', 's'], ['ぞ', 'ゾ', 'zo', 's'],
  ['だ', 'ダ', 'da', 't'], ['ぢ', 'ヂ', 'ji', 't', ['di', 'dji']], ['づ', 'ヅ', 'zu', 't', ['du', 'dzu']], ['で', 'デ', 'de', 't'], ['ど', 'ド', 'do', 't'],
  ['ば', 'バ', 'ba', 'h'], ['び', 'ビ', 'bi', 'h'], ['ぶ', 'ブ', 'bu', 'h'], ['べ', 'ベ', 'be', 'h'], ['ぼ', 'ボ', 'bo', 'h'],
  ['ぱ', 'パ', 'pa', 'h'], ['ぴ', 'ピ', 'pi', 'h'], ['ぷ', 'プ', 'pu', 'h'], ['ぺ', 'ペ', 'pe', 'h'], ['ぽ', 'ポ', 'po', 'h'],
];

// Combined sounds: consonant-i kana + small ゃ/ゅ/ょ.
const YOON_BASES: [string, string, string, KanaRow][] = [
  ['き', 'キ', 'ky', 'k'], ['ぎ', 'ギ', 'gy', 'k'], ['し', 'シ', 'sh', 's'], ['じ', 'ジ', 'j', 's'],
  ['ち', 'チ', 'ch', 't'], ['に', 'ニ', 'ny', 'n'], ['ひ', 'ヒ', 'hy', 'h'], ['び', 'ビ', 'by', 'h'],
  ['ぴ', 'ピ', 'py', 'h'], ['み', 'ミ', 'my', 'm'], ['り', 'リ', 'ry', 'r'],
];
const YOON_SMALL: [string, string, string][] = [['ゃ', 'ャ', 'a'], ['ゅ', 'ュ', 'u'], ['ょ', 'ョ', 'o']];
// Non-Hepburn spellings players commonly type for the sh/j/ch rows.
const YOON_ALT: Record<string, string[]> = {
  sha: ['sya'], shu: ['syu'], sho: ['syo'], ja: ['zya', 'jya'], ju: ['zyu', 'jyu'], jo: ['zyo', 'jyo'],
  cha: ['tya', 'cya'], chu: ['tyu', 'cyu'], cho: ['tyo', 'cyo'],
};

function build(): Kana[] {
  const out: Kana[] = [];
  const push = (script: Script, char: string, romaji: string, row: KanaRow, kind: KanaKind, alt: string[] = []) => {
    const prefix = script === 'hiragana' ? 'h' : 'k';
    // ぢ/づ read the same as じ/ず, so their ids use the d-spelling to stay unique.
    const key = char === 'ぢ' || char === 'ヂ' ? 'di' : char === 'づ' || char === 'ヅ' ? 'du' : romaji;
    out.push({ id: `${prefix}-${key}`, char, romaji, alt, script, row, kind });
  };
  for (const [row, cells] of Object.entries(BASIC) as [KanaRow, (typeof BASIC)[KanaRow]][]) {
    for (const [h, k, romaji, alt] of cells) {
      push('hiragana', h, romaji, row, 'basic', alt);
      push('katakana', k, romaji, row, 'basic', alt);
    }
  }
  for (const [h, k, romaji, row, alt] of DAKUTEN) {
    push('hiragana', h, romaji, row, 'dakuten', alt);
    push('katakana', k, romaji, row, 'dakuten', alt);
  }
  for (const [hb, kb, cons, row] of YOON_BASES) {
    for (const [hs, ks, vowel] of YOON_SMALL) {
      const romaji = cons + vowel;
      push('hiragana', hb + hs, romaji, row, 'yoon', YOON_ALT[romaji]);
      push('katakana', kb + ks, romaji, row, 'yoon', YOON_ALT[romaji]);
    }
  }
  return out;
}

export const KANA: readonly Kana[] = build();

const BY_ID = new Map(KANA.map((k) => [k.id, k]));

export function getKana(id: string): Kana {
  const k = BY_ID.get(id);
  if (!k) throw new Error(`Unknown kana id: ${id}`);
  return k;
}

export function kanaWhere(filter: Partial<Pick<Kana, 'script' | 'row' | 'kind'>>): Kana[] {
  return KANA.filter(
    (k) =>
      (filter.script === undefined || k.script === filter.script) &&
      (filter.row === undefined || k.row === filter.row) &&
      (filter.kind === undefined || k.kind === filter.kind),
  );
}

/**
 * Characters learners genuinely confuse. Wrong-answer choices are drawn from these
 * first, so a battle tests discrimination, not just elimination of obvious misfits.
 */
export const LOOKALIKE_GROUPS: readonly string[][] = [
  // hiragana
  ['ぬ', 'め', 'の'], ['ね', 'れ', 'わ'], ['さ', 'ち', 'き'], ['は', 'ほ', 'け'], ['る', 'ろ'],
  ['う', 'ら', 'つ'], ['し', 'つ', 'く'], ['い', 'り', 'こ'], ['く', 'へ'], ['あ', 'お', 'め'],
  ['ま', 'も', 'ほ'], ['た', 'な'], ['そ', 'ろ'], ['ゆ', 'よ'], ['を', 'ち'], ['ん', 'そ'],
  // katakana
  ['シ', 'ツ', 'ソ', 'ン'], ['ク', 'ケ', 'タ', 'ワ'], ['ウ', 'ワ', 'フ', 'ラ'], ['コ', 'ユ', 'ロ'],
  ['ナ', 'メ', 'ス', 'ヌ'], ['チ', 'テ', 'ナ'], ['ア', 'マ', 'ヤ'], ['ノ', 'ソ', 'メ'], ['ル', 'レ'],
  ['エ', 'ニ', 'ユ'], ['ヲ', 'ラ', 'フ'], ['セ', 'サ', 'ヤ'], ['ハ', 'ル', 'ト'],
];

const LOOKALIKES = new Map<string, Set<string>>();
for (const group of LOOKALIKE_GROUPS) {
  for (const c of group) {
    const set = LOOKALIKES.get(c) ?? new Set<string>();
    group.forEach((o) => o !== c && set.add(o));
    LOOKALIKES.set(c, set);
  }
}

/** Characters that look like `char` (excluding itself). */
export function lookalikesOf(char: string): string[] {
  return [...(LOOKALIKES.get(char) ?? [])];
}

/** True when `typed` is an accepted romaji spelling for the kana. Case/space-insensitive. */
export function acceptsRomaji(kana: Kana, typed: string): boolean {
  const t = typed.trim().toLowerCase();
  return t === kana.romaji || kana.alt.includes(t);
}
