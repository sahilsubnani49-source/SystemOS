import { NATIVE_WORDS, getWord } from './words';

// FOCUS puzzles: the hard questions. A party member spends their turn on one, and
// solving it charges the whole party's next attacks (see SURGE_CHARGES in
// battle/engine.ts). Everything is plain hiragana.
//
//   order     word tiles to put into a sentence        (grammar: particles, verb last)
//   scramble  the kana of a word, shuffled             (generated from the native words)
//   riddle    a なぞなぞ, four answers                  (reading for meaning, and wordplay)
//   oddOne    four words, one does not belong          (vocabulary and grammar categories)
//
// Ids are `z-…` and are save-file keys: append, never rename.

export type Puzzle =
  | { id: string; kind: 'order'; /** Tiles in their correct order. */ tiles: string[]; en: string; /** Other correct orders, as tile indexes. */ alt: number[][] }
  | { id: string; kind: 'scramble'; wordId: string }
  | { id: string; kind: 'riddle'; text: string; en: string; answer: string; wrong: [string, string, string]; why: string }
  | { id: string; kind: 'oddOne'; answer: string; others: [string, string, string]; why: string }
  | Star;

/**
 * The JLPT's sentence-building question (問題2, "★"): four pieces fit the four
 * blanks in one order only, and the exam asks which piece lands on the ★. Here
 * the player builds the whole sentence; the ★ is shown so it reads like the
 * real paper. Ids are `z-j5-<n>` (N5) and `z-j4-<n>` (N4).
 */
export interface Star {
  id: string;
  kind: 'star';
  level: 'n5' | 'n4';
  before: string;
  /** The four pieces, in the correct order. */
  tiles: [string, string, string, string];
  /** Written right after the last blank (include a leading space if a word follows). */
  after: string;
  /** Which blank (0-3) carries the ★. */
  star: number;
  en: string;
  /** Other correct orders, as tile indexes. */
  alt: number[][];
}

// Japanese word order is loose before the verb, so each sentence lists every
// other order that is also natural. Anything not listed is marked wrong.
const ORDER: [tiles: string[], en: string, alt?: number[][]][] = [
  [['ねこは', 'さかなを', 'たべます'], 'The cat eats fish.', [[1, 0, 2]]],
  [['わたしは', 'ともだちと', 'うみで', 'およぎます'], 'I swim in the sea with a friend.', [[0, 2, 1, 3]]],
  [['おじいさんは', 'やまへ', 'たけを', 'とりに', 'いきました'], 'The old man went to the mountain to gather bamboo.', [[0, 2, 3, 1, 4]]],
  [['これは', 'わたしの', 'ともだちの', 'ねこです'], "This is my friend's cat."],
  [['きのう', 'おばあさんは', 'かわで', 'ももを', 'みつけました'], 'Yesterday the old woman found a peach in the river.', [[1, 0, 2, 3, 4], [0, 1, 3, 2, 4]]],
  [['あめですが', 'わたしは', 'むらへ', 'かえります'], 'It is raining, but I will go back to the village.'],
  [['みずを', 'のんで', 'から', 'ねます'], 'After drinking water, I sleep.'],
  [['この', 'おおきい', 'いぬは', 'こわく', 'ないです'], 'This big dog is not scary.'],
];

const RIDDLES: [text: string, en: string, answer: string, wrong: [string, string, string], why: string][] = [
  ['うえは おおみず、 したは おおかじ。 これは なに？', 'Great water above, great fire below. What is it?', 'おふろ', ['うみ', 'やま', 'あめ'],
    'おふろ: the old wood-fired bath, hot water over a fire.'],
  ['とっても とっても へらない ものは なに？', 'You can take and take, yet it never runs out. What is it?', 'しゃしん', ['みず', 'たから', 'ゆき'],
    'しゃしん (photo): とる means both "to take" and "to take a picture".'],
  ['あさは よんほん、 ひるは にほん、 よるは さんぼん。 これは なに？', 'Four legs in the morning, two at noon, three at night. What is it?', 'ひと', ['いぬ', 'とり', 'かめ'],
    'ひと (a person): a crawling baby, an adult, an elder with a stick.'],
  ['かけば かくほど へる ものは なに？', 'The more you write, the smaller it gets. What is it?', 'えんぴつ', ['ほん', 'つくえ', 'て'],
    'えんぴつ (pencil): every line wears it down.'],
  ['いつも そらに いるのに、 ひるは みえない ものは なに？', 'It is always in the sky, yet unseen by day. What is it?', 'ほし', ['くも', 'とり', 'あめ'],
    'ほし (stars): still there at noon, hidden by the sun.'],
  ['うえから よんでも したから よんでも おなじ どうぶつは なに？', 'Which animal reads the same forwards and backwards?', 'こねこ', ['こいぬ', 'ことり', 'こうま'],
    'こねこ (kitten): こ・ね・こ is a palindrome.'],
];

const ODD: [answer: string, others: [string, string, string], why: string][] = [
  ['やま', ['いぬ', 'ねこ', 'さる'], 'いぬ, ねこ and さる are animals; やま is a mountain.'],
  ['さかな', ['たべる', 'のむ', 'あるく'], 'たべる, のむ and あるく are verbs; さかな is a noun.'],
  ['ちから', ['うれしい', 'かなしい', 'こわい'], 'The others are feelings ending in い; ちから (strength) is a noun.'],
  ['かめ', ['つき', 'ほし', 'そら'], 'つき, ほし and そら are in the heavens; a かめ is a turtle.'],
  ['いただきます', ['ただいま', 'おかえり', 'いってきます'], 'The others are said when leaving or coming home; いただきます is said before eating.'],
  ['いきました', ['いきます', 'たべます', 'のみます'], 'いきました is the only past tense.'],
];

/** A word split into the units a learner moves: きょ and しゃ stay whole. */
export function kanaTiles(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    if ('ゃゅょ'.includes(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

/** Long enough that rebuilding it is a puzzle, not a coin flip. */
const SCRAMBLE_MIN_TILES = 3;

export const PUZZLES: readonly Puzzle[] = [
  ...ORDER.map(([tiles, en, alt = []], n): Puzzle => ({ id: `z-o${n + 1}`, kind: 'order', tiles, en, alt })),
  ...RIDDLES.map(([text, en, answer, wrong, why], n): Puzzle => ({ id: `z-r${n + 1}`, kind: 'riddle', text, en, answer, wrong, why })),
  ...ODD.map(([answer, others, why], n): Puzzle => ({ id: `z-d${n + 1}`, kind: 'oddOne', answer, others, why })),
  ...NATIVE_WORDS.filter((w) => kanaTiles(w.text).length >= SCRAMBLE_MIN_TILES).map(
    (w): Puzzle => ({ id: `z-s-${w.romaji}`, kind: 'scramble', wordId: w.id }),
  ),
];

type StarRow = [before: string, tiles: [string, string, string, string], after: string, star: number, en: string, alt?: number[][]];

const STAR_N5: StarRow[] = [
  ['ほんは', ['つくえ', 'の', 'うえ', 'に'], ' あります。', 2, 'The book is on the desk.'],
  ['あそこに', ['いる', 'ひと', 'が', 'やまださん'], 'です。', 2, 'The person over there is Mr. Yamada.'],
  ['きのう', ['ともだち', 'と', 'えいが', 'を'], ' みました。', 1, 'Yesterday I saw a movie with a friend.', [[2, 3, 0, 1]]],
  ['わたしは', ['にほん', 'の', 'うた', 'が'], ' すきです。', 2, 'I like Japanese songs.'],
  ['すみません、', ['トイレ', 'は', 'どこ', 'です'], 'か。', 2, 'Excuse me, where is the toilet?'],
  ['これは', ['だれ', 'の', 'かさ', 'です'], 'か。', 1, 'Whose umbrella is this?'],
  ['まいばん', ['じゅういちじ', 'ごろ', 'に', 'ねます'], '。', 1, 'I go to bed around eleven every night.'],
  ['わたしは', ['ははに', 'てがみを', 'かきたい', 'です'], '。', 2, 'I want to write a letter to my mother.', [[1, 0, 2, 3]]],
  ['きょうは', ['さむい', 'から', 'うちで', 'やすみます'], '。', 1, "It's cold today, so I'll rest at home."],
  ['この', ['あかい', 'くつは', 'とても', 'たかい'], 'です。', 2, 'These red shoes are very expensive.'],
  ['しゅくだいを', ['して', 'から', 'テレビを', 'みます'], '。', 1, 'After doing my homework, I watch TV.'],
  ['いっしょに', ['ひるごはんを', 'たべ', 'ません', 'か'], '。', 2, "Won't you have lunch with me?"],
];

const STAR_N4: StarRow[] = [
  ['あめが', ['ふって', 'も', 'しあいは', 'あります'], '。', 2, 'Even if it rains, the match is on.'],
  ['わたしは', ['ははに', 'やさいを', 'たべ', 'させられました'], '。', 2, 'I was made to eat vegetables by my mother.', [[1, 0, 2, 3]]],
  ['でんしゃの なかで', ['だれかに', 'あしを', 'ふまれ', 'ました'], '。', 2, 'On the train, someone stepped on my foot.', [[1, 0, 2, 3]]],
  ['にほんへ', ['いく', 'まえに', 'ひらがなを', 'おぼえて'], ' おきます。', 2, "Before going to Japan, I'll learn hiragana."],
  ['あしたは', ['あめが', 'ふる', 'かも', 'しれません'], '。', 2, 'It might rain tomorrow.'],
  ['せんせいが', ['いった', 'とおりに', 'ぶんを', 'かいて'], ' ください。', 1, 'Please write the sentence just as the teacher said.'],
  ['かぎを', ['かけた', 'か', 'どうか', 'わすれました'], '。', 2, "I've forgotten whether I locked it."],
  ['たくさん', ['べんきょう', 'した', 'のに', 'しけんに'], ' おちました。', 2, 'Even though I studied a lot, I failed the exam.'],
  ['しゃちょうは', ['もう', 'おかえり', 'に', 'なりました'], '。', 2, 'The president has already gone home.'],
  ['まいあさ', ['はしる', 'こと', 'に', 'して'], ' います。', 1, 'I make a point of running every morning.'],
  ['まどが', ['あけて', 'ある', 'のは', 'へやが'], ' あついからです。', 2, 'The window is open because the room is hot.'],
  ['この ペンは', ['かるくて', 'とても', 'かき', 'やすい'], 'です。', 2, 'This pen is light and very easy to write with.', [[1, 0, 2, 3]]],
];

const toStars = (level: Star['level'], rows: StarRow[]): Star[] =>
  rows.map(([before, tiles, after, star, en, alt = []], n) => ({ id: `z-j${level[1]}-${n + 1}`, kind: 'star', level, before, tiles, after, star, en, alt }));

/** JLPT ★ questions. Kept out of `PUZZLES`: FOCUS opens in Arc 1, far below N4. */
export const STARS: readonly Star[] = [...toStars('n5', STAR_N5), ...toStars('n4', STAR_N4)];

export function starsFor(level: Star['level']): Star[] {
  return STARS.filter((q) => q.level === level);
}

/** The question as the exam prints it: four blanks, one of them ★. */
export function starFrame(q: Star): string {
  const blanks = q.tiles.map((_, i) => (i === q.star ? '★' : '＿'));
  return `${q.before} ${blanks.join(' ')}${q.after.startsWith(' ') ? ' ' : ''}${q.after.trim()}`;
}

const BY_ID = new Map<string, Puzzle>([...PUZZLES, ...STARS].map((p) => [p.id, p]));

export function getPuzzle(id: string): Puzzle {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Unknown puzzle id: ${id}`);
  return p;
}

/** The finished answer, as the player would read it. */
export function puzzleSolution(p: Puzzle): string {
  if (p.kind === 'order') return p.tiles.join(' ');
  if (p.kind === 'scramble') return getWord(p.wordId).text;
  if (p.kind === 'star') return `${p.before} ${p.tiles.join(' ')}${p.after.startsWith(' ') ? ' ' : ''}${p.after.trim()}`;
  return p.answer;
}

/** The line shown with the answer: why it is the answer. */
export function puzzleWhy(p: Puzzle): string {
  if (p.kind === 'order') return p.en;
  if (p.kind === 'scramble') return getWord(p.wordId).meaning;
  if (p.kind === 'star') return `★ = ${p.tiles[p.star]}. ${p.en}`;
  return p.why;
}

/** Story flag that teaches the party FOCUS (Grandmother Fumi, at the well). */
export const FOCUS_FLAG = 'learned_focus';

/** The puzzles a battle may offer: none until FOCUS has been taught. */
export function focusPool(flags: Record<string, boolean>): string[] {
  return flags[FOCUS_FLAG] ? PUZZLES.map((p) => p.id) : [];
}
