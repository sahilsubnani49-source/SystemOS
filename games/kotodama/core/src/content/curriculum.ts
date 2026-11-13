import { kanaWhere, type KanaKind, type KanaRow, type Script } from './kana';
import { wordsForArea, type LessonArea, type WordArea } from './words';
import { listeningFor } from './listening';
import { PHRASES } from './phrases';
import { TALE_PASSAGES } from './tales';
import { starsFor, type Star } from './puzzles';
import { kanjiInGroup, type KanjiGroup } from './kanji';
import { GRAMMAR, lessonGrammarFor, sentencesForArea, type Sentence } from './sentences';
import { passagesForArea, type PassageArea } from './passages';

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
  /** Reading-passage sets included in the pool (Arc 5). */
  passages?: PassageArea[];
  /** The Well of Old Tales: set phrases and proverbs. */
  phrases?: boolean;
  /** The Well of Old Tales: the hiragana grammar sentences. */
  grammar?: boolean;
  /** The Well of Old Tales: questions on these folk tales (tale ids). */
  tales?: string[];
  /** The Terakoya: these classrooms' grammar sentences. */
  lessonGrammar?: LessonArea[];
  /** The Terakoya: these classrooms' listening exercises. */
  listening?: LessonArea[];
  /** The Terakoya's exam halls: JLPT ★ sentence-building questions of these levels. */
  stars?: Star['level'][];
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
const N3_WORDS: PassageArea[] = ['coast', 'glacier', 'forge', 'valor', 'runeforge'];
function n3(id: string, label: string, groups: number, all = false): AreaCurriculum {
  const step = groups / 2; // 1..5: this area's position in the arc
  const words = all ? N3_WORDS : N3_WORDS.slice(Math.max(0, step - 2), step);
  return { id, arc: 5, label, script: 'hiragana', newRows: [], rows: [], kinds: [], kanji: N3_ORDER.slice(0, groups), words, passages: words };
}

const area = (a: Omit<AreaCurriculum, 'script'> & { script?: Script }): AreaCurriculum => ({ script: 'hiragana', ...a });

/** The Terakoya's classrooms, in teaching order. */
const LESSONS: LessonArea[] = ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5', 'lesson6', 'lesson7', 'lesson8', 'lesson9', 'lesson10', 'lesson11'];

/** A classroom from room 5 on: its own material plus the room before, so last week comes back. */
function lesson(n: number, label: string): AreaCurriculum {
  const sets = LESSONS.slice(n - 2, n);
  return area({ id: `lesson${n}`, arc: 3, label, newRows: [], rows: [], kinds: [], words: sets, lessonGrammar: sets, listening: sets });
}

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
  // ── The Well of Old Tales (side dungeon, opens after Arc 1; hiragana only) ──
  // No bare kana: these floors teach what kana are FOR. Each floor keeps the
  // floor before it, and the last one is everything.
  well1: area({ id: 'well1', arc: 1, label: 'Hiragana words', newRows: [], rows: [], kinds: [], words: ['well1'], tales: ['momotaro'] }),
  well2: area({ id: 'well2', arc: 1, label: 'Phrases and proverbs', newRows: [], rows: [], kinds: [], words: ['well1', 'well2'], phrases: true, tales: ['urashima'] }),
  well3: area({ id: 'well3', arc: 1, label: 'Grammar: particles and endings', newRows: [], rows: [], kinds: [], words: ['well2', 'well3'], grammar: true, tales: ['tsuru'] }),
  well4: area({
    id: 'well4', arc: 1, label: 'Exercises: words, phrases and grammar', newRows: [], rows: [], kinds: [],
    words: ['well1', 'well2', 'well3'], phrases: true, grammar: true, tales: ['momotaro', 'urashima', 'tsuru', 'kaguya'],
  }),
  // ── The Terakoya (Castle Town's school): kana only, in course order. ─────
  // Words build up room by room; grammar and listening are this room's plus the last.
  lesson1: area({ id: 'lesson1', arc: 3, label: 'Lesson: introductions and prices', newRows: [], rows: [], kinds: [], words: ['lesson1'], lessonGrammar: ['lesson1'], listening: ['lesson1'] }),
  lesson2: area({ id: 'lesson2', arc: 3, label: 'Lesson: daily life and verbs', newRows: [], rows: [], kinds: [], words: ['lesson1', 'lesson2'], lessonGrammar: ['lesson1', 'lesson2'], listening: ['lesson1', 'lesson2'] }),
  lesson3: area({ id: 'lesson3', arc: 3, label: 'Lesson: adjectives and requests', newRows: [], rows: [], kinds: [], words: ['lesson2', 'lesson3'], lessonGrammar: ['lesson2', 'lesson3'], listening: ['lesson2', 'lesson3'] }),
  lesson4: area({ id: 'lesson4', arc: 3, label: 'Lesson: people and experiences', newRows: [], rows: [], kinds: [], words: ['lesson3', 'lesson4'], lessonGrammar: ['lesson3', 'lesson4'], listening: ['lesson3', 'lesson4'] }),
  lesson5: lesson(5, 'Lesson: plans, comparisons, changes'),
  lesson6: lesson(6, 'Lesson: health, advice, obligation'),
  // The N5 exam hall: everything from rooms 1-6, plus ★ questions.
  jlpt5: area({ id: 'jlpt5', arc: 3, label: 'JLPT N5 mock exam', newRows: [], rows: [], kinds: [], words: LESSONS.slice(0, 6), lessonGrammar: LESSONS.slice(0, 6), listening: LESSONS.slice(0, 6), stars: ['n5'] }),
  lesson7: lesson(7, 'Lesson: can, looks like, giving'),
  lesson8: lesson(8, 'Lesson: plans, favours, preparing'),
  lesson9: lesson(9, 'Lesson: hearsay, if, by itself'),
  lesson10: lesson(10, 'Lesson: polite Japanese (keigo)'),
  lesson11: lesson(11, 'Lesson: passive and causative'),
  // The N4 exam hall: everything from rooms 7-11, plus ★ questions of both levels.
  jlpt4: area({ id: 'jlpt4', arc: 3, label: 'JLPT N4 mock exam', newRows: [], rows: [], kinds: [], words: LESSONS.slice(6), lessonGrammar: LESSONS.slice(6), listening: LESSONS.slice(6), stars: ['n5', 'n4'] }),
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
    ...(a.passages ?? []).flatMap((set) => passagesForArea(set).map((p) => p.id)),
    ...(a.phrases ? PHRASES.map((p) => p.id) : []),
    ...(a.grammar ? GRAMMAR.map((g) => g.id) : []),
    ...TALE_PASSAGES.filter((t) => a.tales?.includes(t.taleId)).map((t) => t.id),
    ...(a.lessonGrammar ?? []).flatMap((set) => lessonGrammarFor(set).map((s) => s.id)),
    ...(a.listening ?? []).flatMap((set) => listeningFor(set).map((l) => l.id)),
    ...(a.stars ?? []).flatMap((level) => starsFor(level).map((q) => q.id)),
  ];
}
