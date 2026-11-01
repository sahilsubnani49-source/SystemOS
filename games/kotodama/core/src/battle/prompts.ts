import { getKana, KANA, lookalikesOf, acceptsRomaji, type Kana } from '../content/kana';
import { getItem, isKanaId, isKanjiId, isPassageId, isSentenceId, isWordId, mirrorKanaId } from '../content/items';
import { getWord, WORDS, type Word } from '../content/words';
import { KANJI, acceptedKanjiRomaji, getKanji, kanjiLookalikes, kanjiReadings, primaryReading, type Kanji } from '../content/kanji';
import { toHiragana, toRomaji } from '../util/romaji';
import type { PromptKind } from '../content/moves';
import type { Rng } from '../util/rng';

export interface Prompt {
  kind: PromptKind;
  /** The study item under test: a kana id (h-ka, k-ka) or a word id (w-terebi). */
  itemId: string;
  /** Big text on the prompt card ('' for listen prompts). */
  display: string;
  /** Text to pronounce. Always set: the reveal speaks it even when the prompt doesn't. */
  speak: string;
  /** Multiple-choice options; empty for 'type'. */
  choices: string[];
  /** The correct choice (for 'type', the canonical romaji). */
  answer: string;
  /** Optional line under the prompt (a sentence's English translation). */
  hint?: string;
  timeLimitMs: number | null;
}

export const CHOICE_COUNT = 4;

/**
 * Wrong answers, in order of preference: real look-alikes → same row and script →
 * anything else from the encounter pool → anything of the same script and kind.
 * Never duplicates and never repeats the answer.
 */
export function pickDistractors(target: Kana, pool: readonly string[], rng: Rng, count = CHOICE_COUNT - 1): Kana[] {
  const chosen: Kana[] = [];
  const seen = new Set<string>([target.char]);
  // Answers are compared as text, so two kana with the same reading (じ/ぢ) must not both appear.
  const seenRomaji = new Set<string>([target.romaji]);
  const take = (candidates: Kana[]) => {
    for (const k of rng.shuffle(candidates)) {
      if (chosen.length >= count) return;
      if (seen.has(k.char) || seenRomaji.has(k.romaji)) continue;
      seen.add(k.char);
      seenRomaji.add(k.romaji);
      chosen.push(k);
    }
  };
  const sameScript = KANA.filter((k) => k.script === target.script);
  take(sameScript.filter((k) => lookalikesOf(target.char).includes(k.char)));
  take(sameScript.filter((k) => k.row === target.row && k.kind === target.kind));
  take(pool.filter(isKanaId).map(getKana).filter((k) => k.script === target.script));
  take(sameScript.filter((k) => k.kind === target.kind));
  return chosen;
}

// ── Words ──────────────────────────────────────────────────────────────

const SMALL_TSU = 'ッ';
const LONG = 'ー';
/** Katakana confusions that make real misspellings (シ/ツ, ソ/ン...). */
const SWAPS: Record<string, string> = { シ: 'ツ', ツ: 'シ', ソ: 'ン', ン: 'ソ', ク: 'ワ', ワ: 'ク', ヌ: 'ス', ス: 'ヌ', チ: 'テ', テ: 'チ', ル: 'レ', レ: 'ル', コ: 'ユ', ユ: 'コ' };

/**
 * Near-miss spellings of a word: the mistakes learners actually make: dropping or
 * adding the long-vowel mark ー, dropping or adding a small ッ, and swapping
 * look-alike kana. None of them equals the real spelling.
 */
export function misspellings(text: string): string[] {
  const out = new Set<string>();
  const chars = [...text];
  if (text.includes(LONG)) out.add(text.replace(LONG, ''));
  else if (chars.length >= 2) out.add(chars[0] + LONG + chars.slice(1).join(''));
  if (text.includes(SMALL_TSU)) out.add(text.replace(SMALL_TSU, ''));
  else if (chars.length >= 2) out.add(chars.slice(0, -1).join('') + SMALL_TSU + chars[chars.length - 1]);
  chars.forEach((c, i) => {
    const swap = SWAPS[c];
    if (swap) out.add([...chars.slice(0, i), swap, ...chars.slice(i + 1)].join(''));
  });
  out.delete(text);
  return [...out];
}

/** `count` distinct strings from the candidate lists, in priority order, never `answer`. */
function takeDistinct(answer: string, lists: string[][], rng: Rng, count = CHOICE_COUNT - 1): string[] {
  const seen = new Set([answer]);
  const out: string[] = [];
  for (const list of lists) {
    for (const v of rng.shuffle(list)) {
      if (out.length >= count) return out;
      if (seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function poolWords(pool: readonly string[]): Word[] {
  return pool.filter(isWordId).map(getWord);
}

// ── Readings (kanji + vocabulary) ──────────────────────────────────────

const VOICED: Record<string, string> = {};
'かが きぎ くぐ けげ こご さざ しじ すず せぜ そぞ ただ ちぢ つづ てで とど はば ひび ふぶ へべ ほぼ'
  .split(' ')
  .forEach((pair) => {
    const [plain, voiced] = [...pair] as [string, string];
    VOICED[plain] = voiced;
    VOICED[voiced] = plain;
  });
const SMALL_TO_BIG: Record<string, string> = { ゃ: 'や', ゅ: 'ゆ', ょ: 'よ' };
const vowelOf = (ch: string) => {
  try {
    return toRomaji(ch).slice(-1);
  } catch {
    return '';
  }
};

/**
 * Near-miss READINGS: the slips learners make when reading kanji aloud. A small っ
 * dropped or added, a long vowel lost or invented (しゅう ↔ しゅ), the wrong voicing
 * (か ↔ が), a big ゆ where a small ゅ belongs. Never equal to the real reading.
 */
export function readingMutations(reading: string): string[] {
  // Work in MORAE, not characters: しゅ is one sound, so っ never lands before ゅ and
  // the long vowel in しゅう is found by looking at しゅ as a whole.
  const morae: string[] = [];
  for (const ch of reading) {
    if (SMALL_TO_BIG[ch] && morae.length) morae[morae.length - 1] += ch;
    else morae.push(ch);
  }
  const out = new Set<string>();
  const join = (a: string[]) => a.join('');
  if (reading.includes('っ')) out.add(reading.replace('っ', ''));
  else if (morae.length >= 3) out.add(join([morae[0]!, 'っ', ...morae.slice(1)]));
  const longU = morae.findIndex((m, i) => i > 0 && m === 'う' && ['o', 'u'].includes(vowelOf(morae[i - 1]!)));
  if (longU > 0) out.add(join([...morae.slice(0, longU), ...morae.slice(longU + 1)]));
  else {
    const o = morae.findIndex((m) => vowelOf(m) === 'o');
    if (o >= 0) out.add(join([...morae.slice(0, o + 1), 'う', ...morae.slice(o + 1)]));
  }
  morae.forEach((m, i) => {
    const head = [...m][0]!;
    const voiced = VOICED[head];
    if (voiced && i < 2) out.add(join([...morae.slice(0, i), voiced + m.slice(1), ...morae.slice(i + 1)]));
    const small = [...m][1];
    if (small && SMALL_TO_BIG[small]) out.add(join([...morae.slice(0, i), head + SMALL_TO_BIG[small], ...morae.slice(i + 1)]));
  });
  out.delete(reading);
  return [...out];
}

/** Wrong spellings of a kanji word: one kanji swapped for a look-alike, or two swapped round. */
export function kanjiMisspellings(text: string): string[] {
  const chars = [...text];
  const out = new Set<string>();
  chars.forEach((c, i) => {
    for (const look of kanjiLookalikes(c)) out.add([...chars.slice(0, i), look, ...chars.slice(i + 1)].join(''));
  });
  if (chars.length === 2) out.add(chars[1]! + chars[0]!);
  out.delete(text);
  return [...out];
}

/** Readings shown as answers: on'yomi in hiragana and full kun'yomi (stems omitted). */
function shownReadings(k: Kanji): string[] {
  return [...new Set([...k.on.map(toHiragana), ...k.kun.map((r) => r.replace('.', ''))])];
}

/**
 * Not every prompt kind fits every item: a word can't be typed or mirrored, a single
 * kana has no meaning, and you can't "hear" which kanji is meant (too many share a
 * sound). Map the move's kind to the closest one that works, so every move stays
 * usable in every area.
 */
export function resolveKind(kind: PromptKind, itemId: string): PromptKind {
  // A sentence is only ever a fill-in-the-blank and a passage only ever a reading
  // question; nothing else uses 'context' or 'passage'.
  if (isSentenceId(itemId)) return 'context';
  if (isPassageId(itemId)) return 'passage';
  if (kind === 'context' || kind === 'passage') return isWordId(itemId) && getWord(itemId).kind === 'vocab' ? 'reading' : isKanjiId(itemId) ? 'meaning' : isWordId(itemId) ? 'meaning' : 'recognize';
  if (isWordId(itemId)) {
    const vocab = getWord(itemId).kind === 'vocab';
    if (kind === 'recall') return 'spell';
    if (vocab && (kind === 'type' || kind === 'mirror' || kind === 'recognize')) return 'reading';
    if (!vocab && (kind === 'type' || kind === 'mirror' || kind === 'reading')) return 'meaning';
    return kind;
  }
  if (isKanjiId(itemId)) {
    if (kind === 'recognize') return 'reading';
    if (kind === 'listen' || kind === 'mirror') return 'meaning';
    if (kind === 'spell') return 'recall';
    return kind;
  }
  if (kind === 'meaning' || kind === 'reading') return 'recognize';
  if (kind === 'spell') return 'recall';
  return kind;
}

function buildKanjiPrompt(kind: PromptKind, k: Kanji, pool: readonly string[], rng: Rng, timeLimitMs: number | null): Prompt {
  const base = { kind, itemId: k.id, speak: primaryReading(k), timeLimitMs };
  const poolKanji = pool.filter(isKanjiId).map(getKanji).filter((o) => o.id !== k.id);
  const others = KANJI.filter((o) => o.id !== k.id);
  switch (kind) {
    case 'meaning': {
      const answer = k.meanings[0] as string;
      const lookalikeMeanings = kanjiLookalikes(k.char).map((c) => KANJI.find((o) => o.char === c)?.meanings[0]).filter(Boolean) as string[];
      return { ...base, display: k.char, answer, choices: rng.shuffle([answer, ...takeDistinct(answer, [lookalikeMeanings, poolKanji.map((o) => o.meanings[0] as string), others.map((o) => o.meanings[0] as string)], rng)]) };
    }
    case 'recall': {
      const answer = k.char;
      return { ...base, display: k.meanings[0] as string, answer, choices: rng.shuffle([answer, ...takeDistinct(answer, [kanjiLookalikes(k.char), poolKanji.map((o) => o.char), others.map((o) => o.char)], rng)]) };
    }
    case 'type':
      return { ...base, display: k.char, answer: toRomaji(primaryReading(k)), choices: [] };
    default: {
      // reading: any one of its readings is the answer; no choice may be ANY valid reading.
      const answer = rng.pick(shownReadings(k));
      const valid = new Set(kanjiReadings(k));
      const notValid = (list: string[]) => list.filter((r) => !valid.has(r));
      return {
        ...base,
        kind: 'reading',
        display: k.char,
        speak: answer,
        answer,
        choices: rng.shuffle([answer, ...takeDistinct(answer, [notValid(readingMutations(answer)), notValid(poolKanji.flatMap(shownReadings)), notValid(others.flatMap(shownReadings))], rng)]),
      };
    }
  }
}

export function buildPrompt(requested: PromptKind, itemId: string, pool: readonly string[], rng: Rng, timeLimitMs: number | null): Prompt {
  const kind = resolveKind(requested, itemId);
  const item = getItem(itemId);
  const base = { kind, itemId, timeLimitMs };

  if (item.kind === 'kanji') return buildKanjiPrompt(kind, item.kanji, pool, rng, timeLimitMs);

  if (item.kind === 'passage') {
    const p = item.passage;
    // Reading a passage takes as long as it takes: never on a clock, even from a timed move.
    return { ...base, timeLimitMs: null, display: p.text, hint: p.question, speak: p.text, answer: p.answer, choices: rng.shuffle([p.answer, ...p.wrong]) };
  }

  if (item.kind === 'sentence') {
    const s = item.sentence;
    return { ...base, display: s.text, hint: s.en, speak: s.text.replace('＿＿', s.answer), answer: s.answer, choices: rng.shuffle([s.answer, ...s.wrong]) };
  }

  if (item.kind === 'word') {
    const w = item.word;
    // Distractors come from the same kind of word: loanwords vs loanwords, vocab vs vocab.
    const others = poolWords(pool).filter((o) => o.id !== w.id && o.kind === w.kind);
    const everyone = WORDS.filter((o) => o.id !== w.id && o.kind === w.kind);
    const nearMisses = w.kind === 'vocab' ? kanjiMisspellings(w.text) : misspellings(w.text);
    const spellings = () => takeDistinct(w.text, [nearMisses, others.map((o) => o.text), everyone.map((o) => o.text)], rng);
    const speak = w.reading;
    switch (kind) {
      case 'meaning':
        return { ...base, display: w.text, speak, answer: w.meaning, choices: rng.shuffle([w.meaning, ...takeDistinct(w.meaning, [others.map((o) => o.meaning), everyone.map((o) => o.meaning)], rng)]) };
      case 'recognize':
        return { ...base, display: w.text, speak, answer: w.romaji, choices: rng.shuffle([w.romaji, ...takeDistinct(w.romaji, [others.map((o) => o.romaji), everyone.map((o) => o.romaji)], rng)]) };
      case 'reading':
        return { ...base, display: w.text, speak, answer: w.reading, choices: rng.shuffle([w.reading, ...takeDistinct(w.reading, [readingMutations(w.reading), others.map((o) => o.reading), everyone.map((o) => o.reading)], rng)]) };
      case 'listen':
        return { ...base, display: '', speak, answer: w.text, choices: rng.shuffle([w.text, ...spellings()]) };
      default: // spell
        return { ...base, kind: 'spell', display: w.romaji, speak, answer: w.text, choices: rng.shuffle([w.text, ...spellings()]) };
    }
  }

  const kana = item.kana;
  const speak = kana.char;
  if (kind === 'mirror') {
    const twin = getKana(mirrorKanaId(kana.id) as string);
    const wrong = pickDistractors(twin, [], rng);
    return { ...base, speak, display: kana.char, answer: twin.char, choices: rng.shuffle([twin, ...wrong].map((k) => k.char)) };
  }
  const wrong = pickDistractors(kana, pool, rng);
  switch (kind) {
    case 'recall':
      return { ...base, speak, display: kana.romaji, answer: kana.char, choices: rng.shuffle([kana, ...wrong].map((k) => k.char)) };
    case 'listen':
      return { ...base, speak, display: '', answer: kana.char, choices: rng.shuffle([kana, ...wrong].map((k) => k.char)) };
    case 'type':
      return { ...base, speak, display: kana.char, answer: kana.romaji, choices: [] };
    default: // recognize
      return { ...base, kind: 'recognize', speak, display: kana.char, answer: kana.romaji, choices: rng.shuffle([kana, ...wrong].map((k) => k.romaji)) };
  }
}

export type Grade = 'correct' | 'wrong' | 'timeout';

export function gradeAnswer(prompt: Prompt, value: string, elapsedMs: number): Grade {
  if (prompt.timeLimitMs !== null && elapsedMs > prompt.timeLimitMs) return 'timeout';
  if (prompt.kind === 'type') return acceptsTyped(prompt.itemId, value) ? 'correct' : 'wrong';
  return value === prompt.answer ? 'correct' : 'wrong';
}

/** Typed romaji for a kana (any accepted spelling) or a kanji (ANY of its readings). */
export function acceptsTyped(itemId: string, typed: string): boolean {
  if (!isKanjiId(itemId)) return acceptsRomaji(getKana(itemId), typed);
  // Macrons are accepted as long vowels: kō = kou, jū = juu.
  const t = typed.trim().toLowerCase().replace(/ō/g, 'ou').replace(/ū/g, 'uu').replace(/ā/g, 'aa').replace(/ī/g, 'ii').replace(/ē/g, 'ee');
  return acceptedKanjiRomaji(getKanji(itemId)).includes(t);
}
