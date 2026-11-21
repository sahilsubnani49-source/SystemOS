import type { HonsaiArea, Word } from '../words';
import { toRomaji } from '../../util/romaji';
import { HONSAI_ROWS } from './words.generated';

// Honsai's vocabulary: thousands of words, chosen by hand per district and checked
// against JMdict (see tools/honsai/). Ids are `x-<romaji>`, with -2, -3... for words
// that share a reading (熱い and 厚い are both あつい), counted in list order: add new
// words at the END of a district list so existing ids, and the SRS history saved
// against them, never move.

/** How a verb or adjective conjugates ('' for everything else). */
export type ConjClass =
  | '' | 'ichidan' | 'u' | 'ku' | 'iku' | 'gu' | 'su' | 'tsu' | 'nu' | 'bu' | 'mu' | 'ru' | 'aru' | 'ru-aru'
  | 'kuru' | 'suru' | 'i-adj' | 'ii-adj' | 'na-adj';

export interface HonsaiWord extends Word {
  cls: ConjClass;
  district: number;
}

export const honsaiArea = (district: number) => `honsai${district}` as HonsaiArea;
/** The Great Library, after the twelve districts: JMdict's common words, shelved in wings. */
export const LIBRARY_DISTRICT = 13;
export const libraryArea = (wing: number) => `honsai_lib${wing}` as HonsaiArea;

// The Library counts its ids apart (x-l-...), so adding words to a district list can never
// renumber a Library word, and the other way round.
const used = new Map<string, number>();
const usedLib = new Map<string, number>();
export const HONSAI_WORDS: readonly HonsaiWord[] = HONSAI_ROWS.map(([text, reading, meaning, cls, kind, from, district, wing]) => {
  const romaji = toRomaji(reading);
  const lib = district === LIBRARY_DISTRICT;
  const seen = lib ? usedLib : used;
  const n = (seen.get(romaji) ?? 0) + 1;
  seen.set(romaji, n);
  const base = lib ? `x-l-${romaji}` : `x-${romaji}`;
  return {
    id: n === 1 ? base : `${base}-${n}`,
    kind: kind as Word['kind'],
    text,
    reading,
    romaji,
    meaning,
    from,
    area: lib ? libraryArea(wing ?? 1) : honsaiArea(district),
    cls: cls as ConjClass,
    district,
  };
});

const BY_ID = new Map(HONSAI_WORDS.map((w) => [w.id, w]));
export const getHonsaiWord = (id: string) => BY_ID.get(id);
export const honsaiWordsIn = (district: number) => HONSAI_WORDS.filter((w) => w.district === district);
/** The Library's wings, in order, with their words. */
export const LIBRARY_WINGS: readonly number[] = [...new Set(HONSAI_WORDS.filter((w) => w.district === LIBRARY_DISTRICT).map((w) => Number(w.area.slice('honsai_lib'.length))))];
