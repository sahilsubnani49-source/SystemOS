import { getKana, KANA, lookalikesOf, acceptsRomaji, type Kana } from '../content/kana';
import type { PromptKind } from '../content/moves';
import type { Rng } from '../util/rng';

export interface Prompt {
  kind: PromptKind;
  kanaId: string;
  /** Big text on the prompt card: the kana (recognize/type), its romaji (recall), or '' (listen). */
  display: string;
  /** Kana to speak aloud. Always set: the reveal speaks it even when the prompt doesn't. */
  speak: string;
  /** Multiple-choice options; empty for 'type'. */
  choices: string[];
  /** The correct choice (romaji for recognize, kana char for recall/listen, romaji for type). */
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
  take(pool.map(getKana).filter((k) => k.script === target.script));
  take(sameScript.filter((k) => k.kind === target.kind));
  return chosen;
}

export function buildPrompt(kind: PromptKind, kanaId: string, pool: readonly string[], rng: Rng, timeLimitMs: number | null): Prompt {
  const kana = getKana(kanaId);
  const wrong = pickDistractors(kana, pool, rng);
  const base = { kind, kanaId, speak: kana.char, timeLimitMs };
  switch (kind) {
    case 'recognize':
      return { ...base, display: kana.char, answer: kana.romaji, choices: rng.shuffle([kana, ...wrong].map((k) => k.romaji)) };
    case 'recall':
      return { ...base, display: kana.romaji, answer: kana.char, choices: rng.shuffle([kana, ...wrong].map((k) => k.char)) };
    case 'listen':
      return { ...base, display: '', answer: kana.char, choices: rng.shuffle([kana, ...wrong].map((k) => k.char)) };
    case 'type':
      return { ...base, display: kana.char, answer: kana.romaji, choices: [] };
  }
}

export type Grade = 'correct' | 'wrong' | 'timeout';

export function gradeAnswer(prompt: Prompt, value: string, elapsedMs: number): Grade {
  if (prompt.timeLimitMs !== null && elapsedMs > prompt.timeLimitMs) return 'timeout';
  if (prompt.kind === 'type') return acceptsRomaji(getKana(prompt.kanaId), value) ? 'correct' : 'wrong';
  return value === prompt.answer ? 'correct' : 'wrong';
}
