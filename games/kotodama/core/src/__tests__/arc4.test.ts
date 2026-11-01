import { describe, expect, it } from 'vitest';
import { KANJI_LOOKALIKES, getKanji, kanjiAt, kanjiByChar, kanjiInGroup } from '../content/kanji';
import { SENTENCES } from '../content/sentences';
import { VOCABULARY } from '../content/words';
import { CURRICULUM, areaIntroducingGroup, poolForArea } from '../content/curriculum';
import { buildPrompt, resolveKind } from '../battle/prompts';
import { SPIRIT_FAMILIES, familyItemIds } from '../content/spirits';
import { familyStage, foeCombatant, spiritCombatant } from '../progression';
import { reduce, startBattle } from '../battle/engine';
import { MAX_STAGE } from '../srs/schedule';
import { createRng } from '../util/rng';

const KANJI_CHAR = /[一-鿿]/;
const N4_AREAS = ['foothills', 'village', 'monastery', 'forest', 'peaks'];

describe('kanji look-alike groups', () => {
  it('never list the same character twice in one group', () => {
    for (const g of KANJI_LOOKALIKES) expect(new Set(g).size, g.join('')).toBe(g.length);
  });
});

describe('N4 context sentences', () => {
  it('has ~30 sentences, each with exactly one blank and three distinct wrong answers', () => {
    expect(SENTENCES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(SENTENCES.map((s) => s.id)).size).toBe(SENTENCES.length);
    for (const s of SENTENCES) {
      expect(s.text.split('＿＿').length - 1, s.text).toBe(1);
      expect(new Set([s.answer, ...s.wrong]).size, s.text).toBe(4);
      expect(s.en.length).toBeGreaterThan(5);
    }
  });

  it("only uses kanji already taught by the sentence's area (sentence and answer)", () => {
    const order = Object.keys(CURRICULUM);
    for (const s of SENTENCES) {
      for (const ch of [...(s.text + s.answer)].filter((c) => KANJI_CHAR.test(c))) {
        const k = kanjiByChar(ch);
        expect(k, `${s.text}: ${ch} is not taught at all`).toBeDefined();
        expect(order.indexOf(areaIntroducingGroup(k!.group)!), `${s.text}: ${ch}`).toBeLessThanOrEqual(order.indexOf(s.area));
      }
    }
  });

  it('builds context prompts with the translation as a hint and the full sentence spoken', () => {
    const rng = createRng(4);
    for (const s of SENTENCES) {
      const p = buildPrompt('recognize', s.id, [], rng, null);
      expect(p.kind).toBe('context');
      expect(p.hint).toBe(s.en);
      expect(p.choices).toHaveLength(4);
      expect(p.choices).toContain(s.answer);
      expect(p.speak).toContain(s.answer);
      expect(p.speak).not.toContain('＿＿');
    }
  });

  it('maps a context move onto something every other item supports', () => {
    expect(resolveKind('context', 'j-水')).toBe('meaning');
    expect(resolveKind('context', 'v-gakusei')).toBe('reading');
    expect(resolveKind('context', 'w-pan')).toBe('meaning');
    expect(resolveKind('context', 'h-ka')).toBe('recognize');
    expect(resolveKind('type', 'c-1')).toBe('context');
  });
});

describe('sentence moves', () => {
  it('always ask a sentence when the area has sentences', () => {
    const pool = poolForArea('foothills');
    const yamabiko = spiritCombatant({ uid: 'y', familyId: 'yamabiko', level: 45, xp: 0 }, {});
    expect(yamabiko.moves).toContain('echoCall');
    const foe = foeCombatant({ familyId: 'yukionna', level: 45, hpScale: 20 }, 'f', pool, createRng(1));
    // A harmless foe: this test is about which prompts appear, not about surviving.
    let s = startBattle({ party: [yamabiko], enemies: [{ ...foe, atk: 1 }], kanaPool: pool, srs: {}, seed: 3 });
    for (let i = 0; i < 6; i++) {
      s = reduce(s, { type: 'choose', move: 'echoCall', now: 0 });
      expect(s.prompt?.kind, `round ${i}: phase ${s.phase}`).toBe('context');
      s = reduce(s, { type: 'answer', value: s.prompt!.answer, elapsedMs: 500, now: 0 });
    }
  });
});

describe('N4 curriculum', () => {
  it('ends with a mock exam over every N4 kanji, word and sentence, and no N5 kanji', () => {
    const pool = poolForArea('summit');
    expect(pool.filter((id) => id.startsWith('j-'))).toHaveLength(kanjiAt('N4').length);
    expect(pool.some((id) => id.startsWith('j-') && getKanji(id).level === 'N5')).toBe(false);
    expect(pool.filter((id) => id.startsWith('v-'))).toHaveLength(VOCABULARY.filter((v) => N4_AREAS.includes(v.area)).length);
    expect(pool.filter((id) => id.startsWith('c-'))).toHaveLength(SENTENCES.length);
  });

  it('gives foes a kanji true name even when the pool holds sentences and words', () => {
    // Regression: "not a word and not a kanji" used to mean "kana", and getKana('c-1') threw.
    const pool = poolForArea('summit');
    for (let i = 0; i < 10; i++) {
      const foe = foeCombatant({ familyId: 'kamaitachi', level: 50 }, 'f', pool, createRng(i));
      expect(getKanji(foe.trueName!).group).toBe('n4movement');
    }
  });
});

describe('mountain yokai', () => {
  const n4 = SPIRIT_FAMILIES.filter((f) => f.kanjiGroup?.startsWith('n4'));

  it('has one family per N4 group, each named with a kanji from its own group', () => {
    expect(n4).toHaveLength(11);
    expect(new Set(n4.map((f) => f.kanjiGroup)).size).toBe(11);
    for (const f of n4) {
      const chars = kanjiInGroup(f.kanjiGroup!).map((k) => k.char);
      for (const st of f.stages) expect([...st.nameJa].some((c) => chars.includes(c)), `${f.id}: ${st.nameJa}`).toBe(true);
    }
  });

  it('evolves from mastery of its N4 group', () => {
    const f = n4.find((x) => x.id === 'yukionna')!;
    const mastered = Object.fromEntries(familyItemIds(f).map((id) => [id, { id, stage: MAX_STAGE, dueAt: 0, reps: 5, lapses: 0, lastSeenAt: 0 }]));
    expect(familyStage(f.id, mastered)).toBe(2);
  });
});
