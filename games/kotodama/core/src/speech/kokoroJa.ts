import { KANA, KANA_PAIRS, VOCAB } from './kokoroTables';

// The text front end for Kokoro's Japanese voices: kana in, phoneme tokens out.
//
// Kokoro (an open-weight neural voice) does not read Japanese. It reads a string
// of phoneme characters, and its Japanese voices were trained on the output of
// misaki's "cutlet" converter, which looks every word up in a dictionary first.
// A phone has no dictionary, so this file does the same job from spelling alone,
// and only for text it can do reliably:
//
//   - kana only (hiragana, katakana, ー). Anything with kanji returns null: a
//     kanji's reading cannot be known without a dictionary.
//   - words separated by spaces, or one short word. A long unspaced run returns
//     null: without word boundaries the particles は and へ cannot be told apart
//     from the same kana inside a word.
//
// A null means "use the device voice for this one". Wrong is worse than plain.
//
// Two things the dictionary gave the original converter are rebuilt by rule:
//   long vowels   こう → koː, せい → seː, おかあ → okaː (its "pronunciation" field)
//   particles     word-final は → βa, へ → e, を → o, spoken as their own word

const SMALL = new Set('ゃゅょぁぃぅぇぉ');
const BARE_VOWEL: Record<string, string> = { あ: 'a', い: 'i', う: 'ɯ', え: 'e', お: 'o' };

/** Longest kana run with no space that is still treated as a single word. */
const MAX_UNSPACED_KANA = 12;
/** The model takes at most this many phoneme tokens (plus a pad at each end). */
export const KOKORO_MAX_TOKENS = 510;

/**
 * Words whose vowel + vowel is two beats, not one long vowel: dictionary-form
 * verbs ending in う (おもう is o-mo-u), and compounds split across the vowels.
 */
const NOT_LONG = new Set([
  'おもう', 'ひろう', 'かよう', 'まよう', 'さそう', 'そろう', 'やとう', 'におう',
  'すう', 'くう', 'ぬう', 'すくう', 'ばあい', 'さとおや',
]);

/** Greetings that end in the particle は but are one word. */
const ONE_WORD = new Set(['こんにちは', 'こんばんは']);

const PUNCT: Record<string, string> = {
  '。': '.', '．': '.', '.': '.', '、': ',', '，': ',', ',': ',', '？': '?', '?': '?', '！': '!', '!': '!',
  '：': ':', ':': ':', '；': ';', ';': ';', '…': '…', '「': '“', '『': '“', '」': '”', '』': '”', '・': ' ', '〜': '—', '～': '—', '—': '—',
};

function toHiragana(text: string): string {
  let out = '';
  for (const ch of text.normalize('NFKC')) {
    const c = ch.codePointAt(0) as number;
    // Katakana ァ..ヶ sit exactly 0x60 above their hiragana.
    out += c >= 0x30a1 && c <= 0x30f6 ? String.fromCodePoint(c - 0x60) : ch;
  }
  return out;
}

const isKana = (ch: string) => (ch >= 'ぁ' && ch <= 'ゖ') || ch === 'ー';

/** The vowel a phoneme string ends on, with Kokoro's two "u" sounds folded together. */
function endVowel(ps: string): string {
  const last = ps[ps.length - 1] ?? '';
  return last === 'ɨ' ? 'ɯ' : last;
}

/** One kana word to phonemes. `lengthen` is off for words in NOT_LONG. */
function wordToPhonemes(word: string): string {
  const lengthen = !NOT_LONG.has(word);
  const kana = [...word];
  // Split into beats first, so ん can look at the sound that follows it.
  const beats: string[] = [];
  for (let i = 0; i < kana.length; i++) {
    const kk = kana[i] as string;
    const nk = kana[i + 1];
    if (nk && KANA_PAIRS[kk + nk]) {
      beats.push(KANA_PAIRS[kk + nk] as string);
      i++;
    } else if (nk && SMALL.has(nk) && KANA[kk] && kk !== 'っ') {
      // An unlisted combination: the consonant of the first, the vowel of the small kana.
      beats.push((KANA[kk] as string).slice(0, -1) + (KANA[nk] as string));
      i++;
    } else if (kk === 'ー') beats.push('ː');
    else if (kk === 'っ') beats.push('ʔ');
    else if (kk === 'ん') beats.push('N');
    else if (SMALL.has(kk)) continue;
    else if (BARE_VOWEL[kk] && i > 0 && lengthen && isLongVowel(kk, kana[i - 1] as string, beats[beats.length - 1] ?? '')) beats.push('ː');
    else beats.push(KANA[kk] ?? '');
  }
  return beats.map((b, i) => (b === 'N' ? nasal(beats[i + 1]) : b)).join('');
}

/** Does this bare vowel kana lengthen the beat before it, instead of sounding on its own? */
function isLongVowel(kk: string, prevKana: string, prevBeat: string): boolean {
  const prev = prevBeat === 'ː' ? '' : endVowel(prevBeat);
  const v = BARE_VOWEL[kk];
  if (prev === v) return true; // おかあさん, いい, くうき, おねえさん, おおきい
  if (kk === 'う' && prev === 'o') return true; // がっこう, きょう
  // せんせい, えいご. Not after て or で: that is a verb's て-form meeting いる or いく.
  if (kk === 'い' && prev === 'e') return prevKana !== 'て' && prevKana !== 'で';
  return false;
}

/** ん takes its place of articulation from the sound that follows. */
function nasal(next: string | undefined): string {
  if (!next) return 'ɴ';
  const c = next[0] as string;
  if ('mpb'.includes(c)) return 'm';
  if ('kɡ'.includes(c)) return 'ŋ';
  if (next.startsWith('ɲ') || next.startsWith('ʨ') || next.startsWith('ʥ')) return 'ɲ';
  if ('ntdɾz'.includes(c)) return 'n';
  return 'ɴ';
}

/** A trailing particle spoken as its own word: [stem, particle phonemes]. */
function splitParticle(word: string): [string, string] | null {
  if (ONE_WORD.has(word)) return null;
  const last = word[word.length - 1];
  if (last === 'は') return [word.slice(0, -1), 'βa'];
  if (last === 'へ') return [word.slice(0, -1), 'e'];
  if (last === 'を') return [word.slice(0, -1), 'o'];
  return null;
}

/**
 * Kana text to Kokoro's phoneme string, or null when this text cannot be
 * converted reliably (see the top of the file).
 */
export function kanaToPhonemes(text: string): string | null {
  const hira = toHiragana(text).trim();
  if (!hira) return null;

  // Tokenise into kana words, punctuation and spaces; anything else is unreadable here.
  const tokens: { kind: 'word' | 'punct'; text: string }[] = [];
  let run = '';
  const flush = () => {
    if (run) tokens.push({ kind: 'word', text: run });
    run = '';
  };
  for (const ch of hira) {
    if (isKana(ch)) run += ch;
    else if (/\s/.test(ch)) flush();
    else if (PUNCT[ch] !== undefined) {
      flush();
      tokens.push({ kind: 'punct', text: PUNCT[ch] as string });
    } else return null;
  }
  flush();

  const words = tokens.filter((t) => t.kind === 'word');
  if (words.length === 0) return null;
  if (words.some((w) => [...w.text].length > MAX_UNSPACED_KANA)) return null;
  // One word on its own is a flashcard: は is the kana "ha", not the particle.
  const sentence = words.length > 1;

  let out = '';
  for (const tok of tokens) {
    if (tok.kind === 'punct') {
      // Closing marks hug the word before them; an opening quote hugs the next.
      if (tok.text === '“') out += ' “';
      else if (tok.text === ' ') out += ' ';
      else out = `${out.trimEnd()}${tok.text} `;
      continue;
    }
    const split = sentence ? splitParticle(tok.text) : null;
    let ps: string;
    // こんにちは: its は is the particle "wa", but the greeting is one word.
    if (ONE_WORD.has(tok.text)) ps = `${wordToPhonemes(tok.text.slice(0, -1))}βa`;
    else if (!split) ps = wordToPhonemes(tok.text);
    else if (split[0]) ps = `${wordToPhonemes(split[0])} ${split[1]}`;
    else ps = split[1];
    out += out.endsWith('“') ? ps : ` ${ps}`;
    out += ' ';
  }
  // A glottal stop (っ) belongs to the sounds around it, never to a pause.
  const ps = out.replace(/\s+/g, ' ').replace(/ ʔ/g, 'ʔ').replace(/ʔ (?!“)/g, 'ʔ').trim();
  return ps || null;
}

/** Phoneme string to token ids, padded with 0 at both ends as the model expects. */
export function phonemesToIds(phonemes: string): number[] {
  const ids = [0];
  for (const ch of phonemes) {
    const id = VOCAB[ch];
    if (id !== undefined) ids.push(id);
  }
  ids.push(0);
  return ids;
}

/**
 * Everything the model needs for one line: its token ids, or null when the line
 * should go to the device voice (unreadable here, or too long for one pass).
 */
export function kokoroTokens(text: string): number[] | null {
  const ps = kanaToPhonemes(text);
  if (!ps) return null;
  const ids = phonemesToIds(ps);
  return ids.length - 2 > KOKORO_MAX_TOKENS || ids.length <= 2 ? null : ids;
}
