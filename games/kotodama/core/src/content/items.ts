import { getKana, type Kana } from './kana';
import { getKanji, primaryReading, type Kanji } from './kanji';
import { getWord, type Word } from './words';
import { getSentence, type Sentence } from './sentences';
import { getPassage, type Passage } from './passages';
import { toRomaji } from '../util/romaji';

/**
 * Anything a prompt can test. Ids carry their own namespace (h- hiragana, k-
 * katakana, j- kanji, w- loanword, v- vocabulary, c- sentence, p- passage), so one SRS table, one save
 * format and one session report cover every kind of item.
 */
export type StudyItem =
  | { kind: 'kana'; id: string; kana: Kana }
  | { kind: 'kanji'; id: string; kanji: Kanji }
  | { kind: 'word'; id: string; word: Word }
  | { kind: 'sentence'; id: string; sentence: Sentence }
  | { kind: 'passage'; id: string; passage: Passage };

export const isWordId = (id: string) => id.startsWith('w-') || id.startsWith('v-');
export const isKanjiId = (id: string) => id.startsWith('j-');
export const isSentenceId = (id: string) => id.startsWith('c-');
export const isPassageId = (id: string) => id.startsWith('p-');
/** Kana are the only items that are NOT one of the other namespaces. Ask explicitly. */
export const isKanaId = (id: string) => id.startsWith('h-') || id.startsWith('k-');

export function getItem(id: string): StudyItem {
  if (isWordId(id)) return { kind: 'word', id, word: getWord(id) };
  if (isSentenceId(id)) return { kind: 'sentence', id, sentence: getSentence(id) };
  if (isPassageId(id)) {
    const passage = getPassage(id);
    if (!passage) throw new Error(`Unknown passage: ${id}`);
    return { kind: 'passage', id, passage };
  }
  if (isKanjiId(id)) return { kind: 'kanji', id, kanji: getKanji(id) };
  return { kind: 'kana', id, kana: getKana(id) };
}

/** What the item looks like written. */
export function itemText(id: string): string {
  const it = getItem(id);
  if (it.kind === 'sentence') return it.sentence.text;
  if (it.kind === 'passage') return it.passage.text;
  return it.kind === 'kana' ? it.kana.char : it.kind === 'kanji' ? it.kanji.char : it.word.text;
}

/** How it is read aloud, in kana (what text-to-speech should say). */
export function itemReading(id: string): string {
  const it = getItem(id);
  if (it.kind === 'sentence') return it.sentence.text.replace('＿＿', it.sentence.answer);
  if (it.kind === 'passage') return it.passage.text;
  return it.kind === 'kana' ? it.kana.char : it.kind === 'kanji' ? primaryReading(it.kanji) : it.word.reading;
}

export function itemRomaji(id: string): string {
  const it = getItem(id);
  if (it.kind === 'sentence' || it.kind === 'passage') return '';
  return it.kind === 'kana' ? it.kana.romaji : it.kind === 'kanji' ? toRomaji(primaryReading(it.kanji)) : it.word.romaji;
}

/** The same sound in the other script (h-ka ↔ k-ka), for Mirror prompts. */
export function mirrorKanaId(id: string): string | null {
  if (id.startsWith('h-')) return `k-${id.slice(2)}`;
  if (id.startsWith('k-')) return `h-${id.slice(2)}`;
  return null;
}
