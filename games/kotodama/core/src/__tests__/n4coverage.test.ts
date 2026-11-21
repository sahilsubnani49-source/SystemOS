import { describe, expect, it } from 'vitest';
import { kanjiByChar } from '../content/kanji';
import { LESSON_GRAMMAR, lessonGrammarFor } from '../content/sentences';
import { poolForArea } from '../content/curriculum';
import { MOVES, type PromptKind } from '../content/moves';
import { buildPrompt } from '../battle/prompts';
import { createRng } from '../util/rng';

// The N4 gaps found by checking the course against KANJIDIC2's (old) JLPT lists and a
// standard N4 grammar list. These tests keep them closed.

/** The N5/N4 kanji the course had not taught one by one before the check. */
const ADDED_KANJI = '何暗回銀建元好工合菜市紙質首集住所真正切洗太代台短池低度特服明薬力';

describe('N4 coverage', () => {
  it('teaches every N5 and N4 kanji on the old JLPT lists one by one', () => {
    for (const c of ADDED_KANJI) expect(kanjiByChar(c), c).toBeDefined();
    expect(kanjiByChar('何')!.level).toBe('N5');
  });

  it('keeps the original lesson ids in place, and gives the added N4 grammar ids of its own', () => {
    // b-1 is the first row of room 1 and must never move: saved review history is keyed by id.
    expect(LESSON_GRAMMAR.find((s) => s.id === 'b-1')!.text).toBe('わたし＿＿ がくせいです。');
    expect(LESSON_GRAMMAR.filter((s) => /^b-\d+$/.test(s.id))).toHaveLength(132);
    const added = LESSON_GRAMMAR.filter((s) => s.id.startsWith('b-x'));
    expect(added.length).toBeGreaterThanOrEqual(60);
    expect(new Set(LESSON_GRAMMAR.map((s) => s.id)).size).toBe(LESSON_GRAMMAR.length);
    for (const s of added) {
      expect(s.text.split('＿＿').length, s.id).toBe(2);
      expect(new Set(s.wrong).size, s.id).toBe(3);
      expect(s.wrong, s.id).not.toContain(s.answer);
    }
  });

  it.each([
    ['ことにする / ことになる', /ことに/], ['ところ', /ところ/], ['よてい', /よてい/], ['にくい', /にくい/],
    ['つづける', /つづけ/], ['ばあい', /ばあい/], ['かまわない', /かまいません/], ['とおりに', /とおりに/],
    ['たがる', /たが/], ['imperative', /とまれ|おきろ/], ['けど', /けど/], ['あまり', /あまり/],
  ])('drills %s at least twice in the N4 rooms', (_name, rx) => {
    const n4 = ['lesson7', 'lesson8', 'lesson9', 'lesson10', 'lesson11'] as const;
    const hits = n4.flatMap((r) => lessonGrammarFor(r)).filter((s) => rx.test(s.text.replace('＿＿', s.answer)));
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });

  it.each(['lesson7', 'lesson8', 'lesson9', 'lesson10', 'lesson11', 'jlpt4'])('%s builds a valid four-choice prompt for every added sentence', (area) => {
    const pool = poolForArea(area);
    const kinds = [...new Set(Object.values(MOVES).map((m) => m.prompt))] as PromptKind[];
    const rng = createRng(4);
    for (const id of pool.filter((i) => i.startsWith('b-x')))
      for (const kind of kinds) {
        const p = buildPrompt(kind, id, pool, rng, null);
        expect(new Set(p.choices).size, `${id}: ${p.choices.join(' / ')}`).toBe(4);
        expect(p.choices).toContain(p.answer);
      }
  });
});
