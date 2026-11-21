import { forgeIdsUpTo, honsaiSentencesIn } from './honsai/forge';
import { particleIds } from './honsai/particles';
import { CURRICULUM, type AreaCurriculum } from './curriculum';
import { kanaWhere } from './kana';
import { kanjiInGroup } from './kanji';
import { wordsForArea } from './words';
import { GRAMMAR, getSentence, lessonGrammarFor, sentencesForArea, type Sentence } from './sentences';
import { listeningFor } from './listening';
import { mainReading } from '../battle/prompts';

/**
 * The lesson scroll (巻物) a sensei unrolls before a new region or a boss: what the
 * battles ahead will ask, taught before they ask it. Built from the curriculum, so a
 * new word set or kanji group shows up here without anyone writing a lesson for it.
 *
 * "New" means first taught here: an item the player met in an earlier area is left
 * out, so each scroll is short. An area that only reviews (a side room, an exam hall)
 * gets its whole pool instead, under a REVIEW heading.
 */
export interface LessonRow {
  /** Japanese, as it will appear in battle. */
  ja: string;
  /** Reading or romaji, when it differs from `ja`. */
  sub?: string;
  en: string;
}

export interface LessonSection {
  heading: string;
  headingJa: string;
  rows: LessonRow[];
  /** One line under the heading: the rule, or how the drill works. */
  note?: string;
}

export interface Lesson {
  area: string;
  title: string;
  sections: LessonSection[];
  /** A word of the way of the samurai, the ninja, or old Japan: flavour, not tested. */
  tip: { ja: string; en: string };
}

/** Set once the scroll for an area has been read (story flag). */
export const lessonFlag = (area: string) => `lesson_${area}`;
/** Set once the scroll before a boss has been read. */
export const bossLessonFlag = (winFlag: string) => `lesson_boss_${winFlag}`;

const MAX_KANJI = 12;
const MAX_WORDS = 10;
const MAX_GRAMMAR = 4;

const ORDER = Object.keys(CURRICULUM);

/** Everything areas before this one (in curriculum order) have taught, by key. */
function taughtBefore(areaId: string): Set<string> {
  const seen = new Set<string>();
  for (const id of ORDER) {
    if (id === areaId) break;
    for (const k of keysOf(CURRICULUM[id] as AreaCurriculum)) seen.add(k);
  }
  return seen;
}

function keysOf(a: AreaCurriculum): string[] {
  return [
    // Each (row, kind) pair is its own key: the shrine adds no rows, only ゛ and ゜.
    ...a.rows.flatMap((r) => a.kinds.map((k) => `kana:${a.script}:${r}:${k}`)),
    ...(a.kanji ?? []).map((g) => `kanji:${g}`),
    ...(a.words ?? []).map((w) => `words:${w}`),
    ...(a.sentences ?? []).map((s) => `sent:${s}`),
    ...(a.lessonGrammar ?? []).map((s) => `lgram:${s}`),
    ...(a.listening ?? []).map((s) => `listen:${s}`),
    ...(a.grammar ? ['grammar'] : []),
    ...(a.honsai ? [`honsai:${a.honsai}`] : []),
    ...(a.forge ? [`forge:${a.forge}`] : []),
    ...(a.particles ?? []).map((g) => `particles:${g}`),
  ];
}

/** "わたしの＿＿は医者です。" with its answer written in. */
const filled = (s: Sentence) => s.text.replace('＿＿', s.answer);

export function lessonFor(areaId: string): Lesson | null {
  const a = CURRICULUM[areaId];
  if (!a) return null;
  const before = taughtBefore(areaId);
  const own = keysOf(a);
  const fresh = own.filter((k) => !before.has(k));
  const review = fresh.length === 0;
  const keep = new Set(review ? own : fresh);
  const sections: LessonSection[] = [];

  const kana = a.kinds.flatMap((kind) =>
    a.rows.filter((row) => keep.has(`kana:${a.script}:${row}:${kind}`)).flatMap((row) => kanaWhere({ script: a.script, row, kind })),
  );
  if (kana.length) {
    sections.push({
      heading: a.script === 'katakana' ? 'NEW KATAKANA' : 'NEW HIRAGANA',
      headingJa: a.script === 'katakana' ? 'カタカナ' : 'ひらがな',
      note: 'Each sound, then its letter. Say them aloud as you read.',
      rows: kana.map((k) => ({ ja: k.char, sub: k.romaji, en: '' })),
    });
  }

  const kanji = (a.kanji ?? []).filter((g) => keep.has(`kanji:${g}`)).flatMap(kanjiInGroup);
  if (kanji.length) {
    sections.push({
      heading: 'KANJI',
      headingJa: 'かんじ',
      note: 'The reading under each is the one the battles ask for.',
      rows: kanji.slice(0, MAX_KANJI).map((k) => ({ ja: k.char, sub: mainReading(k), en: k.meanings.slice(0, 2).join(', ') })),
    });
  }

  const words = (a.words ?? []).filter((w) => keep.has(`words:${w}`)).flatMap(wordsForArea);
  if (words.length) {
    sections.push({
      heading: 'WORDS',
      headingJa: 'ことば',
      rows: words.slice(0, MAX_WORDS).map((w) => ({ ja: w.text, sub: w.text === w.reading ? w.romaji : w.reading, en: w.meaning })),
    });
  }

  const grammar = [
    ...(a.sentences ?? []).filter((s) => keep.has(`sent:${s}`)).flatMap(sentencesForArea),
    ...(a.lessonGrammar ?? []).filter((s) => keep.has(`lgram:${s}`)).flatMap(lessonGrammarFor),
    ...(a.grammar && keep.has('grammar') ? GRAMMAR : []),
    ...(a.honsai && keep.has(`honsai:${a.honsai}`) ? honsaiSentencesIn(a.honsai) : []),
    ...(a.forge && keep.has(`forge:${a.forge}`) ? forgeIdsUpTo(a.forge).map(getSentence) : []),
    ...(a.particles ?? []).filter((g) => keep.has(`particles:${g}`)).flatMap((g) => particleIds([g]).map(getSentence)),
  ];
  if (grammar.length) {
    // Sentences with a rule attached teach best; plain ones fill the rest.
    const ranked = [...grammar.filter((s) => s.note), ...grammar.filter((s) => !s.note)];
    sections.push({
      heading: 'SENTENCES',
      headingJa: 'ぶんぽう',
      note: 'In battle one part goes missing: you choose it.',
      rows: ranked.slice(0, MAX_GRAMMAR).map((s) => ({ ja: filled(s), sub: s.note, en: s.en })),
    });
  }

  const listening = (a.listening ?? []).filter((s) => keep.has(`listen:${s}`)).flatMap(listeningFor);
  if (listening.length) {
    sections.push({
      heading: 'LISTENING',
      headingJa: 'ききとり',
      note: `${listening.length} spoken drills. Tap the speaker to hear again; tap twice to hear it slowly.`,
      rows: [],
    });
  }
  if (a.passages?.length) {
    sections.push({ heading: 'READING', headingJa: 'どっかい', note: 'Short passages, then a question on what they said.', rows: [] });
  }
  if (a.stars?.length) {
    sections.push({ heading: 'EXAM ★', headingJa: 'しけん', note: 'Put four pieces in order and name the one in the ★ place.', rows: [] });
  }

  if (sections.length === 0) return null;
  return { area: areaId, title: review ? `REVIEW: ${a.label.toUpperCase()}` : a.label.toUpperCase(), sections, tip: tipFor(areaId, a.arc) };
}

// Flavour from old Japan, one per scroll, picked by the area so it never changes.
const TIPS: Record<AreaCurriculum['arc'], { ja: string; en: string }[]> = {
  1: [
    { ja: 'れいに はじまり れいに おわる', en: 'It begins with a bow and ends with a bow: the first rule of every dojo.' },
    { ja: 'しのび', en: 'Shinobi, another word for ninja, comes from しのぶ: to endure, to stay hidden.' },
    { ja: 'いちごいちえ', en: 'One time, one meeting: treat every encounter as if it will never come again.' },
    { ja: 'ななころび やおき', en: 'Fall seven times, rise eight. Every samurai fell first.' },
  ],
  2: [
    { ja: 'カタカナ', en: 'Katakana began as monks\' shorthand: pieces of kanji jotted in the margins of sutras.' },
    { ja: 'ちりも つもれば やまと なる', en: 'Even dust, piled up, becomes a mountain. Ten words a day is a mountain by winter.' },
    { ja: 'みずを えた うお', en: 'Like a fish that found water: the way a word feels once it is truly yours.' },
  ],
  3: [
    { ja: 'ぶんぶりょうどう', en: 'The pen and the sword, one path: samurai were expected to write as well as fight.' },
    { ja: 'さどう', en: 'The way of tea: every motion has a reason, as every stroke in a kanji does.' },
    { ja: 'ひつじゅん', en: 'Stroke order matters: top before bottom, left before right. A brush remembers.' },
  ],
  4: [
    { ja: 'しゅぎょう', en: 'Shugyou: the long training of a wandering monk or swordsman. You are on yours.' },
    { ja: 'いしの うえにも さんねん', en: 'Three years even on a cold stone: patience warms anything.' },
    { ja: 'ざぜん', en: 'Zazen: sit, breathe, and let each sentence settle before you answer it.' },
  ],
  6: [
    { ja: 'ことだま', en: 'Kotodama: the spirit that lives in words. Say a word aloud and you give it life.' },
    { ja: 'いちにち ひとこと', en: 'One word a day is 365 by next year. Wapul cannot eat what you use every day.' },
    { ja: 'ちりも つもれば やまと なる', en: 'Even dust becomes a mountain: five thousand words arrive one at a time.' },
  ],
  5: [
    { ja: 'ぶしどう', en: 'Bushido names seven virtues: right action, courage, kindness, respect, honesty, honour, loyalty.' },
    { ja: 'おんこちしん', en: 'Learn the new by studying the old: every rune here began as a word you know.' },
    { ja: 'しんぎたい', en: 'Heart, skill, body: a match is won by all three together.' },
  ],
};

function tipFor(areaId: string, arc: AreaCurriculum['arc']) {
  const list = TIPS[arc];
  let h = 0;
  for (const c of areaId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length] as { ja: string; en: string };
}
