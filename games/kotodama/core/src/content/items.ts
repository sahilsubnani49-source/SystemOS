import { getKana, type Kana } from './kana';
import { getKanji, primaryReading, type Kanji } from './kanji';
import { getWord, type Word } from './words';
import { getSentence, type Sentence } from './sentences';
import { getPassage, type Passage } from './passages';
import { getPhrase, type Phrase } from './phrases';
import { getPuzzle, puzzleSolution, type Puzzle } from './puzzles';
import { getTalePassage } from './tales';
import { getListening, listeningText, type Listening } from './listening';
import { toRomaji } from '../util/romaji';

/**
 * Anything a prompt can test. Ids carry their own namespace (h- hiragana, k-
 * katakana, j- kanji, w- loanword, v- vocabulary, c- sentence, p- passage), so one SRS table, one save
 * format and one session report cover every kind of item.
 *
 * The Well of Old Tales adds: n- native hiragana word, f- phrase, g- grammar
 * sentence, t- folk-tale question, z- FOCUS puzzle.
 *
 * The Terakoya adds: b- lesson grammar sentence, l- listening exercise.
 */
export type StudyItem =
  | { kind: 'kana'; id: string; kana: Kana }
  | { kind: 'kanji'; id: string; kanji: Kanji }
  | { kind: 'word'; id: string; word: Word }
  | { kind: 'sentence'; id: string; sentence: Sentence }
  | { kind: 'passage'; id: string; passage: Pick<Passage, 'id' | 'text' | 'question' | 'answer' | 'wrong'> }
  | { kind: 'phrase'; id: string; phrase: Phrase }
  | { kind: 'puzzle'; id: string; puzzle: Puzzle }
  | { kind: 'listening'; id: string; listening: Listening };

export const isWordId = (id: string) => id.startsWith('w-') || id.startsWith('v-') || id.startsWith('n-');
export const isKanjiId = (id: string) => id.startsWith('j-');
export const isSentenceId = (id: string) => id.startsWith('c-') || id.startsWith('g-') || id.startsWith('b-');
export const isListeningId = (id: string) => id.startsWith('l-');
export const isPassageId = (id: string) => id.startsWith('p-') || id.startsWith('t-');
export const isPhraseId = (id: string) => id.startsWith('f-');
export const isPuzzleId = (id: string) => id.startsWith('z-');
/** Kana are the only items that are NOT one of the other namespaces. Ask explicitly. */
export const isKanaId = (id: string) => id.startsWith('h-') || id.startsWith('k-');

export function getItem(id: string): StudyItem {
  if (isWordId(id)) return { kind: 'word', id, word: getWord(id) };
  if (isSentenceId(id)) return { kind: 'sentence', id, sentence: getSentence(id) };
  if (isPassageId(id)) {
    const passage = getPassage(id) ?? getTalePassage(id);
    if (!passage) throw new Error(`Unknown passage: ${id}`);
    return { kind: 'passage', id, passage };
  }
  if (isPhraseId(id)) return { kind: 'phrase', id, phrase: getPhrase(id) };
  if (isPuzzleId(id)) return { kind: 'puzzle', id, puzzle: getPuzzle(id) };
  if (isListeningId(id)) return { kind: 'listening', id, listening: getListening(id) };
  if (isKanjiId(id)) return { kind: 'kanji', id, kanji: getKanji(id) };
  return { kind: 'kana', id, kana: getKana(id) };
}

/** What the item looks like written. */
export function itemText(id: string): string {
  const it = getItem(id);
  if (it.kind === 'sentence') return it.sentence.text;
  if (it.kind === 'passage') return it.passage.text;
  if (it.kind === 'phrase') return it.phrase.text;
  if (it.kind === 'puzzle') return puzzleSolution(it.puzzle);
  if (it.kind === 'listening') return listeningText(it.listening);
  return it.kind === 'kana' ? it.kana.char : it.kind === 'kanji' ? it.kanji.char : it.word.text;
}

/** How it is read aloud, in kana (what text-to-speech should say). */
export function itemReading(id: string): string {
  const it = getItem(id);
  if (it.kind === 'sentence') return it.sentence.text.replace('＿＿', it.sentence.answer);
  if (it.kind === 'passage') return it.passage.text;
  if (it.kind === 'phrase') return it.phrase.text;
  if (it.kind === 'puzzle') return puzzleSolution(it.puzzle);
  if (it.kind === 'listening') return listeningText(it.listening);
  return it.kind === 'kana' ? it.kana.char : it.kind === 'kanji' ? primaryReading(it.kanji) : it.word.reading;
}

export function itemRomaji(id: string): string {
  const it = getItem(id);
  if (it.kind === 'sentence' || it.kind === 'passage' || it.kind === 'phrase' || it.kind === 'puzzle' || it.kind === 'listening') return '';
  return it.kind === 'kana' ? it.kana.romaji : it.kind === 'kanji' ? toRomaji(primaryReading(it.kanji)) : it.word.romaji;
}

/** The same sound in the other script (h-ka ↔ k-ka), for Mirror prompts. */
export function mirrorKanaId(id: string): string | null {
  if (id.startsWith('h-')) return `k-${id.slice(2)}`;
  if (id.startsWith('k-')) return `h-${id.slice(2)}`;
  return null;
}
