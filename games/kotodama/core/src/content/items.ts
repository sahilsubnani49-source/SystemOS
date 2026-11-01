import { getKana, type Kana } from './kana';
import { getWord, type Word } from './words';

/**
 * Anything a prompt can test. Ids carry their own namespace (h- hiragana, k-
 * katakana, w- word), so one SRS table, one save format and one session report
 * cover every kind of item.
 */
export type StudyItem = { kind: 'kana'; id: string; kana: Kana } | { kind: 'word'; id: string; word: Word };

export function getItem(id: string): StudyItem {
  return id.startsWith('w-') ? { kind: 'word', id, word: getWord(id) } : { kind: 'kana', id, kana: getKana(id) };
}

export const isWordId = (id: string) => id.startsWith('w-');

/** What the item looks like written: the kana or the word's katakana. */
export function itemText(id: string): string {
  const it = getItem(id);
  return it.kind === 'kana' ? it.kana.char : it.word.text;
}

export function itemRomaji(id: string): string {
  const it = getItem(id);
  return it.kind === 'kana' ? it.kana.romaji : it.word.romaji;
}

/** The same sound in the other script (h-ka ↔ k-ka), for Mirror prompts. */
export function mirrorKanaId(id: string): string | null {
  if (id.startsWith('h-')) return `k-${id.slice(2)}`;
  if (id.startsWith('k-')) return `h-${id.slice(2)}`;
  return null;
}
