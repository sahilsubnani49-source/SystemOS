import { kanaWhere, type KanaKind, type KanaRow, type Script } from './kana';
import { wordsForArea, type WordArea } from './words';
import { kanjiInGroup, type KanjiGroup } from './kanji';
import { sentencesForArea, type Sentence } from './sentences';

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
  /** Context-sentence sets included in the pool (Arc 4+). */
  sentences?: Sentence['area'][];
}

const BASIC_ALL: KanaRow[] = ['a', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'nn'];

/** The first `n` N4 kanji groups, in teaching order. */
const N4_ORDER: KanjiGroup[] = [
  'n4family', 'n4seasons', 'n4food', 'n4qualities', 'n4study', 'n4health', 'n4movement', 'n4nature', 'n4town', 'n4thought', 'n4function',
];
const N4_UP_TO = (n: number) => N4_ORDER.slice(0, n);

/** N3 groups in teaching order, and the word areas each Arc 5 area reviews. */
const N3_ORDER: KanjiGroup[] = [
  'n3conflict', 'n3society', 'n3emotion', 'n3work', 'n3weather', 'n3action', 'n3comm', 'n3change', 'n3abstract', 'n3travel',
];
const N3_WORDS: WordArea[] = ['coast', 'glacier', 'forge', 'valor', 'runeforge'];
function n3(id: string, label: string, groups: number, all = false): AreaCurriculum {
  const step = groups / 2; // 1..5: this area's position in the arc
  const words = all ? N3_WORDS : N3_WORDS.slice(Math.max(0, step - 2), step);
  return { id, arc: 5, label, script: 'hiragana', newRows: [], rows: [], kinds: [], kanji: N3_ORDER.slice(0, groups), words };
}

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
  // ── Arc 4: Mountain Temples (N4 kanji, vocabulary and sentences) ────
  foothills: { ...kanjiArea('foothills', 'N4: family + seasons', N4_UP_TO(2), ['foothills'], 4), sentences: ['foothills'] },
  village: { ...kanjiArea('village', 'N4: food + qualities', N4_UP_TO(4), ['foothills', 'village'], 4), sentences: ['foothills', 'village'] },
  monastery: { ...kanjiArea('monastery', 'N4: study + health', N4_UP_TO(6), ['village', 'monastery'], 4), sentences: ['village', 'monastery'] },
  forest: { ...kanjiArea('forest', 'N4: movement + nature', N4_UP_TO(8), ['monastery', 'forest'], 4), sentences: ['monastery', 'forest'] },
  peaks: { ...kanjiArea('peaks', 'N4: town + thought + function', N4_UP_TO(11), ['forest', 'peaks'], 4), sentences: ['forest', 'peaks'] },
  summit: {
    ...kanjiArea('summit', 'N4 mock exam: every N4 kanji, word and sentence', N4_UP_TO(11), ['foothills', 'village', 'monastery', 'forest', 'peaks'], 4),
    sentences: ['foothills', 'village', 'monastery', 'forest', 'peaks'],
  },
  // ── Arc 5: Northern Runeforge (N3) ──
  coast: n3('coast', 'N3: conflict + society', 2),
  glacier: n3('glacier', 'N3: emotion + work', 4),
  forge: n3('forge', 'N3: weather + action', 6),
  valor: n3('valor', 'N3: communication + change', 8),
  runeforge: n3('runeforge', 'N3: reasons + travel', 10),
  finale: n3('finale', 'N3 mock exam: every N3 kanji, word and passage', 10, true),
};

function kanjiArea(id: string, label: string, kanji: KanjiGroup[], words: WordArea[], arc: 3 | 4 = 3): AreaCurriculum {
  return { id, arc, label, script: 'hiragana', newRows: [], rows: [], kinds: [], kanji, words };
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
    ...(a.sentences ?? []).flatMap((set) => sentencesForArea(set).map((s) => s.id)),
  ];
}
