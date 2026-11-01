import { getKana, KANA, lookalikesOf, acceptsRomaji, type Kana } from '../content/kana';
import { getItem, isWordId, mirrorKanaId } from '../content/items';
import { getWord, WORDS, type Word } from '../content/words';
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
  take(pool.filter((id) => !isWordId(id)).map(getKana).filter((k) => k.script === target.script));
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

/**
 * Not every prompt kind fits every item: a word can't be typed or mirrored, and a
 * single kana has no meaning. Map the move's kind to the closest one that works,
 * so every move stays usable in every area.
 */
export function resolveKind(kind: PromptKind, itemId: string): PromptKind {
  if (isWordId(itemId)) {
    if (kind === 'type' || kind === 'mirror') return 'meaning';
    if (kind === 'recall') return 'spell';
    return kind;
  }
  if (kind === 'meaning') return 'recognize';
  if (kind === 'spell') return 'recall';
  return kind;
}

export function buildPrompt(requested: PromptKind, itemId: string, pool: readonly string[], rng: Rng, timeLimitMs: number | null): Prompt {
  const kind = resolveKind(requested, itemId);
  const item = getItem(itemId);
  const base = { kind, itemId, timeLimitMs };

  if (item.kind === 'word') {
    const w = item.word;
    const others = poolWords(pool).filter((o) => o.id !== w.id);
    const everyone = WORDS.filter((o) => o.id !== w.id);
    const spellings = () => takeDistinct(w.text, [misspellings(w.text), others.map((o) => o.text), everyone.map((o) => o.text)], rng);
    switch (kind) {
      case 'meaning':
        return { ...base, display: w.text, speak: w.text, answer: w.meaning, choices: rng.shuffle([w.meaning, ...takeDistinct(w.meaning, [others.map((o) => o.meaning), everyone.map((o) => o.meaning)], rng)]) };
      case 'recognize':
        return { ...base, display: w.text, speak: w.text, answer: w.romaji, choices: rng.shuffle([w.romaji, ...takeDistinct(w.romaji, [others.map((o) => o.romaji), everyone.map((o) => o.romaji)], rng)]) };
      case 'listen':
        return { ...base, display: '', speak: w.text, answer: w.text, choices: rng.shuffle([w.text, ...spellings()]) };
      default: // spell
        return { ...base, kind: 'spell', display: w.romaji, speak: w.text, answer: w.text, choices: rng.shuffle([w.text, ...spellings()]) };
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
  if (prompt.kind === 'type') return acceptsRomaji(getKana(prompt.itemId), value) ? 'correct' : 'wrong';
  return value === prompt.answer ? 'correct' : 'wrong';
}
