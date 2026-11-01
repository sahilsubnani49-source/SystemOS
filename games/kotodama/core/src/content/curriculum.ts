import { kanaWhere, type KanaKind, type KanaRow, type Script } from './kana';
import { wordsForArea, type WordArea } from './words';
import { kanjiInGroup, type KanjiGroup } from './kanji';

/**
 * Which items each area tests. Pools are cumulative: earlier rows keep coming back,
 * so review is built into progress. Later arcs (N5–N3 kanji) add areas here.
 */
export interface AreaCurriculum {
  id: string;
  arc: 1 | 2 | 3 | 4 | 5;
  label: string;
  script: Script;
  /** Rows introduced IN this area (shown on the area banner). */
  newRows: KanaRow[];
  rows: KanaRow[];
  kinds: KanaKind[];
  /** Word sets (loanwords / vocabulary) included in the pool. */
  words?: WordArea[];
  /** Kanji groups included in the pool (Arc 3+). */
  kanji?: KanjiGroup[];
}

const BASIC_ALL: KanaRow[] = ['a', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'nn'];

const area = (a: Omit<AreaCurriculum, 'script'> & { script?: Script }): AreaCurriculum => ({ script: 'hiragana', ...a });

export const CURRICULUM: Record<string, AreaCurriculum> = {
  // ── Arc 1: Sakura Valley (hiragana) ─────────────────────────────────
  dojo: area({ id: 'dojo', arc: 1, label: 'Vowels', newRows: ['a'], rows: ['a'], kinds: ['basic'] }),
  bamboo: area({ id: 'bamboo', arc: 1, label: 'K-row', newRows: ['k'], rows: ['a', 'k'], kinds: ['basic'] }),
  river: area({ id: 'river', arc: 1, label: 'S- and T-rows', newRows: ['s', 't'], rows: ['a', 'k', 's', 't'], kinds: ['basic'] }),
  hideout: area({ id: 'hideout', arc: 1, label: 'N-, H- and M-rows', newRows: ['n', 'h', 'm'], rows: ['a', 'k', 's', 't', 'n', 'h', 'm'], kinds: ['basic'] }),
  pass: area({ id: 'pass', arc: 1, label: 'Y-, R-, W-rows and ん', newRows: ['y', 'r', 'w', 'nn'], rows: BASIC_ALL, kinds: ['basic'] }),
  shrine: area({ id: 'shrine', arc: 1, label: 'Voiced sounds (゛ ゜)', newRows: [], rows: BASIC_ALL, kinds: ['basic', 'dakuten'] }),
  gate: area({ id: 'gate', arc: 1, label: 'All hiragana', newRows: [], rows: BASIC_ALL, kinds: ['basic', 'dakuten', 'yoon'] }),
  // ── Arc 2: Frost Harbor (katakana + loanwords) ──────────────────────
  harbor: area({ id: 'harbor', arc: 2, script: 'katakana', label: 'Katakana: ア and カ rows', newRows: ['a', 'k'], rows: ['a', 'k'], kinds: ['basic'] }),
  docks: area({ id: 'docks', arc: 2, script: 'katakana', label: 'Katakana: サ and タ rows', newRows: ['s', 't'], rows: ['a', 'k', 's', 't'], kinds: ['basic'] }),
  shore: area({ id: 'shore', arc: 2, script: 'katakana', label: 'Katakana: ナ, ハ, マ rows', newRows: ['n', 'h', 'm'], rows: ['a', 'k', 's', 't', 'n', 'h', 'm'], kinds: ['basic'] }),
  caves: area({ id: 'caves', arc: 2, script: 'katakana', label: 'Katakana: ヤ, ラ, ワ, ン, voiced + combined', newRows: ['y', 'r', 'w', 'nn'], rows: BASIC_ALL, kinds: ['basic', 'dakuten', 'yoon'] }),
  // The Skald's trial is a WORD trial: no bare kana, or 30 words drown in ~100 kana.
  tower: area({ id: 'tower', arc: 2, script: 'katakana', label: 'Loanwords (ー and ッ)', newRows: [], rows: [], kinds: [], words: ['tower'] }),
  longship: area({ id: 'longship', arc: 2, script: 'katakana', label: 'All katakana + loanwords', newRows: [], rows: BASIC_ALL, kinds: ['basic', 'dakuten', 'yoon'], words: ['tower', 'longship'] }),
  // ── Arc 3: Castle Capital (N5 kanji + vocabulary) ───────────────────
  // Kanji groups are cumulative; each area adds two groups and their words.
  castle: kanjiArea('castle', 'Kanji: numbers + days', ['numbers', 'days'], ['castle']),
  market: kanjiArea('market', 'Kanji: time + people', ['numbers', 'days', 'time', 'people'], ['castle', 'market']),
  teahouse: kanjiArea('teahouse', 'Kanji: body + directions', ['numbers', 'days', 'time', 'people', 'body', 'directions'], ['market', 'teahouse']),
  gardens: kanjiArea('gardens', 'Kanji: nature + actions', ['numbers', 'days', 'time', 'people', 'body', 'directions', 'nature', 'actions'], ['teahouse', 'gardens']),
  keep: kanjiArea('keep', 'Kanji: adjectives + places', ['numbers', 'days', 'time', 'people', 'body', 'directions', 'nature', 'actions', 'adjectives', 'places'], ['gardens', 'keep']),
  hall: kanjiArea('hall', 'N5 mock exam: every kanji and word', ['numbers', 'days', 'time', 'people', 'body', 'directions', 'nature', 'actions', 'adjectives', 'places'], ['castle', 'market', 'teahouse', 'gardens', 'keep']),
};

function kanjiArea(id: string, label: string, kanji: KanjiGroup[], words: WordArea[]): AreaCurriculum {
  return { id, arc: 3, label, script: 'hiragana', newRows: [], rows: [], kinds: [], kanji, words };
}

/** The first area (in curriculum order) that teaches a kanji group. */
export function areaIntroducingGroup(group: KanjiGroup): string | undefined {
  return Object.values(CURRICULUM).find((a) => a.kanji?.includes(group))?.id;
}

function getArea(areaId: string): AreaCurriculum {
  const a = CURRICULUM[areaId];
  if (!a) throw new Error(`Unknown curriculum area: ${areaId}`);
  return a;
}

/** Kana ids the area tests (no words). */
export function kanaPoolForArea(areaId: string): string[] {
  const a = getArea(areaId);
  return a.kinds.flatMap((kind) => a.rows.flatMap((row) => kanaWhere({ script: a.script, row, kind }).map((k) => k.id)));
}

/** Everything a battle in this area may test: its kana plus its loanwords. */
export function poolForArea(areaId: string): string[] {
  const a = getArea(areaId);
  return [
    ...kanaPoolForArea(areaId),
    ...(a.kanji ?? []).flatMap((g) => kanjiInGroup(g).map((k) => k.id)),
    ...(a.words ?? []).flatMap((set) => wordsForArea(set).map((w) => w.id)),
  ];
}
