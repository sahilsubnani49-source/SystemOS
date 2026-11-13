import { describe, expect, it } from 'vitest';
import { EVERY_WORD, NATIVE_WORDS, type LessonArea } from '../content/words';
import { LESSON_GRAMMAR, getSentence } from '../content/sentences';
import { LISTENING, listeningText } from '../content/listening';
import { MOVES, type PromptKind } from '../content/moves';
import { poolForArea } from '../content/curriculum';
import { getItem, itemReading } from '../content/items';
import { buildPrompt, gradeAnswer, resolveKind } from '../battle/prompts';
import { kokoroTokens } from '../speech/kokoroJa';
import { newGame } from '../save/schema';
import { getMap } from '../world/maps';
import { jlptFlag, passFlag } from '../world/maps/terakoya';
import { SEALS, sealBonus } from '../progression';
import { STARS, puzzleSolution, starFrame, starsFor } from '../content/puzzles';
import { focusPool } from '../content/puzzles';
import { visibleNpcs, warpAt } from '../world/types';
import { createRng } from '../util/rng';

const LESSONS = Array.from({ length: 11 }, (_, i) => `lesson${i + 1}`) as LessonArea[];
/** Kana, the long-vowel mark, spaces and the punctuation the lessons use. Never kanji. */
const KANA_ONLY = /^[ぁ-ゖァ-ーー\s、。？！…「」＿]+$/u;

describe('Terakoya content', () => {
  const lessonWords = NATIVE_WORDS.filter((w) => w.area.startsWith('lesson'));

  it('teaches 16 words per classroom, each id taught only once in the game', () => {
    for (const area of LESSONS) expect(lessonWords.filter((w) => w.area === area)).toHaveLength(16);
    const ids = EVERY_WORD.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    const meanings = NATIVE_WORDS.map((w) => w.meaning);
    expect(new Set(meanings).size).toBe(meanings.length);
  });

  it('writes words, grammar and listening in kana only', () => {
    for (const w of lessonWords) expect(w.text, w.id).toMatch(KANA_ONLY);
    for (const s of LESSON_GRAMMAR) {
      expect(s.text, s.id).toMatch(KANA_ONLY);
      expect([s.answer, ...s.wrong].join(''), s.id).toMatch(KANA_ONLY);
    }
    for (const l of LISTENING) expect(listeningText(l), l.id).toMatch(KANA_ONLY);
  });

  it('has one blank per grammar sentence, a rule note, and four different choices', () => {
    expect(LESSON_GRAMMAR).toHaveLength(12 * 11);
    for (const s of LESSON_GRAMMAR) {
      expect(s.text.split('＿＿'), s.id).toHaveLength(2);
      expect(s.note, s.id).toBeTruthy();
      expect(new Set([s.answer, ...s.wrong]).size, s.id).toBe(4);
      expect(getSentence(s.id)).toBe(s);
    }
  });

  it('has eight listening exercises per classroom with four different answers', () => {
    for (const area of LESSONS) expect(LISTENING.filter((l) => l.area === area)).toHaveLength(8);
    for (const l of LISTENING) expect(new Set([l.answer, ...l.wrong]).size, l.id).toBe(4);
  });

  it('can be read by the neural voice, every line of it', () => {
    const lines = [...lessonWords.map((w) => w.text), ...LESSON_GRAMMAR.map((s) => itemReading(s.id)), ...LISTENING.map(listeningText)];
    expect(lines.filter((line) => !kokoroTokens(line))).toEqual([]);
  });
});

describe('Terakoya battles', () => {
  const kinds = [...new Set(Object.values(MOVES).map((m) => m.prompt))] as PromptKind[];

  it('builds an answerable prompt from every item in every classroom, for every move', () => {
    const rng = createRng(7);
    for (const area of LESSONS) {
      const pool = poolForArea(area);
      expect(pool.some((id) => id.startsWith('l-')), area).toBe(true);
      expect(pool.some((id) => id.startsWith('b-')), area).toBe(true);
      for (const id of pool) {
        for (const kind of kinds) {
          const p = buildPrompt(kind, id, pool, rng, 8000);
          if (p.kind === 'type') continue;
          expect(p.choices, `${id} ${kind}`).toContain(p.answer);
          expect(new Set(p.choices).size, `${id} ${kind}`).toBe(p.choices.length);
          expect(gradeAnswer(p, p.answer, 10), `${id} ${kind}`).toBe('correct');
        }
      }
    }
  });

  it('asks a listening exercise by sound only, untimed, with its question shown', () => {
    const l = LISTENING[0]!;
    const p = buildPrompt('recognize', l.id, [l.id], createRng(1), 5000);
    expect(resolveKind('meaning', l.id)).toBe('hear');
    expect(p).toMatchObject({ kind: 'hear', display: '', hint: l.question, speak: listeningText(l), answer: l.answer, timeLimitMs: null });
    expect(getItem(l.id).kind).toBe('listening');
  });

  it('never turns another item into a listening exercise', () => {
    expect(resolveKind('hear', 'h-ka')).toBe('listen');
  });
});

describe('JLPT ★ questions', () => {
  it('has 12 per level, four pieces each, one ★ in the frame', () => {
    expect(starsFor('n5')).toHaveLength(12);
    expect(starsFor('n4')).toHaveLength(12);
    for (const q of STARS) {
      expect(new Set(q.tiles).size, q.id).toBe(4);
      expect([...starFrame(q)].filter((c) => c === '★'), q.id).toHaveLength(1);
      expect(puzzleSolution(q), q.id).toMatch(KANA_ONLY);
      expect(kokoroTokens(puzzleSolution(q)), q.id).toBeTruthy();
    }
  });

  it('accepts the right order (and listed alternatives) and nothing else', () => {
    const rng = createRng(3);
    for (const q of STARS) {
      const p = buildPrompt('recognize', q.id, [q.id], rng, 5000);
      expect(p.kind).toBe('arrange');
      expect(p.timeLimitMs).toBeNull();
      expect([...p.tiles!].sort()).toEqual([...q.tiles].sort());
      expect(gradeAnswer(p, q.tiles.join(''), 10)).toBe('correct');
      for (const order of q.alt) expect(gradeAnswer(p, order.map((i) => q.tiles[i]).join(''), 10)).toBe('correct');
      expect(gradeAnswer(p, [...q.tiles].reverse().join(''), 10)).toBe('wrong');
    }
  });

  it('stays out of FOCUS, which opens long before N4', () => {
    const pool = focusPool({ learned_focus: true });
    expect(STARS.some((q) => pool.includes(q.id))).toBe(false);
  });
});

describe('Terakoya map', () => {
  const save = { ...newGame('samurai', 'T', '2026-01-01', 1), flags: { beat_oni: true } as Record<string, boolean> };

  it('opens from the west house door in Castle Town', () => {
    expect(warpAt(getMap('castle_town'), 5, 8)?.to).toBe('terakoya_1');
  });

  it('runs rooms 1-6, the N5 hall, rooms 7-11, the N4 hall, each door opened by the exam before it', () => {
    const order = ['1', '2', '3', '4', '5', '6', 'n5', '7', '8', '9', '10', '11', 'n4'];
    const flagOf = (k: string) => (k.startsWith('n') ? jlptFlag(k as 'n5' | 'n4') : passFlag(Number(k)));
    order.slice(0, -1).forEach((k, i) => {
      const door = warpAt(getMap(`terakoya_${k}`), 7, 0);
      expect(door?.to, k).toBe(`terakoya_${order[i + 1]}`);
      expect(door?.requires, k).toBe(flagOf(k));
      expect(warpAt(getMap(`terakoya_${order[i + 1]}`), 7, 10)?.to, k).toBe(`terakoya_${k}`);
    });
    expect(warpAt(getMap('terakoya_n4'), 7, 0)).toBeFalsy();
  });

  it('makes each mock exam a certificate that strengthens the party', () => {
    for (const level of ['n5', 'n4'] as const) {
      expect(SEALS.map((s) => s.flag)).toContain(jlptFlag(level));
      const hall = getMap(`terakoya_${level}`);
      expect(hall.def.npcs.find((n) => n.battle?.isBoss)?.battle?.winFlag).toBe(jlptFlag(level));
      expect(hall.def.encounterRate).toBe(0);
      expect(hall.def.npcs.some((n) => n.heals)).toBe(true);
    }
    expect(sealBonus({ [jlptFlag('n4')]: true }).atk).toBeGreaterThan(1);
  });

  it('keeps practice battles repeatable and gives the school spirit only after graduation', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      const pupil = getMap(`terakoya_${n}`).def.npcs.find((p) => p.id === `pupil_${n}`);
      expect(pupil?.battle?.repeatable).toBe(true);
    }
    const room = getMap('terakoya_4');
    expect(visibleNpcs(room, save.flags).some((n) => n.id === 'warashi_gift')).toBe(false);
    expect(visibleNpcs(room, { ...save.flags, [passFlag(4)]: true }).some((n) => n.id === 'warashi_gift')).toBe(true);
  });
});
