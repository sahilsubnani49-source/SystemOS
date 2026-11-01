import { describe, expect, it } from 'vitest';
import { buildPrompt, gradeAnswer, pickDistractors } from '../battle/prompts';
import { computeDamage, MAX_COMBO_MULTIPLIER, comboMultiplier } from '../battle/damage';
import { battleXp, canPurify, reduce, startBattle, type BattleEvent, type BattleState, type Combatant } from '../battle/engine';
import { getKana, KANA } from '../content/kana';
import { elementMultiplier } from '../content/elements';
import { kanaPoolForArea } from '../content/curriculum';
import { foeCombatant, heroCombatant } from '../progression';
import { newGame } from '../save/schema';
import { createRng } from '../util/rng';

const NOW = 1_800_000_000_000;

describe('prompts', () => {
  it('builds 4 unique choices that include the answer, across many kana', () => {
    const rng = createRng(3);
    const pool = kanaPoolForArea('gate');
    for (const k of KANA) {
      for (const kind of ['recognize', 'recall', 'listen'] as const) {
        const p = buildPrompt(kind, k.id, pool, rng, null);
        expect(p.choices).toHaveLength(4);
        expect(new Set(p.choices).size).toBe(4);
        expect(p.choices).toContain(p.answer);
      }
    }
  });

  it('never offers a distractor that reads the same as the answer (じ vs ぢ)', () => {
    const rng = createRng(5);
    // Ask for many distractors so the search runs past the same-row tier and reaches ぢ.
    for (let i = 0; i < 20; i++) {
      const wrong = pickDistractors(getKana('h-ji'), kanaPoolForArea('gate'), rng, 40);
      expect(wrong.map((k) => k.romaji)).not.toContain('ji');
      expect(new Set(wrong.map((k) => k.romaji)).size).toBe(wrong.length);
    }
  });

  it('draws look-alikes first', () => {
    const wrong = pickDistractors(getKana('h-nu'), ['h-a'], createRng(9));
    expect(wrong.map((k) => k.char)).toEqual(expect.arrayContaining(['め', 'の']));
  });

  it('grades timeouts, typed alternatives and wrong picks', () => {
    const rng = createRng(1);
    const timed = buildPrompt('recognize', 'h-shi', ['h-shi'], rng, 4000);
    expect(gradeAnswer(timed, 'shi', 4001)).toBe('timeout');
    expect(gradeAnswer(timed, 'shi', 500)).toBe('correct');
    const typed = buildPrompt('type', 'h-shi', ['h-shi'], rng, null);
    expect(gradeAnswer(typed, 'si', 0)).toBe('correct');
    expect(gradeAnswer(typed, 'su', 0)).toBe('wrong');
  });
});

describe('damage', () => {
  const base = { atk: 12, def: 10, power: 1, level: 5, attackElement: 'fire', defendElement: 'water', combo: 0, comboStep: 0.1, crit: false, variance: 1 } as const;
  it('keeps the samurai neutral against the fire spirits of the opening area', () => {
    expect(elementMultiplier('fire', 'steel')).toBe(1);
    expect(elementMultiplier('steel', 'fire')).toBe(1);
    expect(elementMultiplier('thunder', 'steel')).toBe(1.5);
  });
  it('never deals less than 1 and caps combo', () => {
    expect(computeDamage({ ...base, atk: 1, def: 999 })).toBe(1);
    expect(comboMultiplier(100, 0.15)).toBe(MAX_COMBO_MULTIPLIER);
  });
  it('rewards element advantage, combos and crits', () => {
    const plain = computeDamage({ ...base, attackElement: 'fire', defendElement: 'earth' });
    expect(computeDamage({ ...base, attackElement: 'fire', defendElement: 'wind' })).toBeGreaterThan(plain);
    expect(computeDamage({ ...base, attackElement: 'fire', defendElement: 'earth', combo: 3 })).toBeGreaterThan(plain);
    expect(computeDamage({ ...base, attackElement: 'fire', defendElement: 'earth', crit: true })).toBeGreaterThan(plain);
  });
});

function setup(seed: number, foeLevel = 2): BattleState {
  const save = newGame('samurai', 'Ren', '2026-11-01', 1);
  const pool = kanaPoolForArea('bamboo');
  const foe = foeCombatant({ familyId: 'kobi', level: foeLevel }, 'foe1', pool, createRng(seed));
  return startBattle({ party: [heroCombatant(save)], enemies: [foe], kanaPool: pool, srs: {}, seed });
}

function answerRight(state: BattleState): BattleState {
  let s = reduce(state, { type: 'choose', move: 'kesa', now: NOW });
  expect(s.phase).toBe('answer');
  s = reduce(s, { type: 'answer', value: s.prompt!.answer, elapsedMs: 800, now: NOW });
  return s;
}

describe('battle engine', () => {
  it('wins by answering correctly, and logs every answer into the SRS table', () => {
    let s = setup(42);
    let guard = 0;
    while (s.phase === 'choose' && guard++ < 50) s = answerRight(s);
    expect(s.phase).toBe('won');
    expect(s.answers.every((a) => a.correct)).toBe(true);
    for (const a of s.answers) expect(s.srs[a.itemId]?.stage).toBeGreaterThan(0);
    expect(battleXp(s)).toBeGreaterThan(0);
  });

  it('misses on a wrong answer, resets the combo, and can lose', () => {
    let s = setup(11, 30);
    let guard = 0;
    while (s.phase === 'choose' && guard++ < 100) {
      s = reduce(s, { type: 'choose', move: 'kesa', now: NOW });
      s = reduce(s, { type: 'answer', value: '__wrong__', elapsedMs: 100, now: NOW });
      expect(s.combo).toBe(0);
      expect(s.events.some((e) => e.type === 'miss')).toBe(true);
    }
    expect(s.phase).toBe('lost');
    expect(battleXp(s)).toBe(0);
  });

  it('lets enemies act once per round, not once per party member', () => {
    const save = newGame('samurai', 'Ren', '2026-11-01', 1);
    const pool = kanaPoolForArea('bamboo');
    const foe = foeCombatant({ familyId: 'tanu', level: 1, hpScale: 50 }, 'foe1', pool, createRng(1));
    const spirit = { ...heroCombatant(save), uid: 'sp1', name: 'Spirit', moves: ['kesa' as const] };
    let s = startBattle({ party: [heroCombatant(save), spirit], enemies: [foe], kanaPool: pool, srs: {}, seed: 4 });
    const hitsOnParty = (st: BattleState) =>
      st.events.filter((e) => e.type === 'damage' && (e.target === 'hero' || e.target === 'sp1')).length;
    s = answerRight(s); // hero acts: round not over yet
    expect(s.actor).toBe(1);
    expect(hitsOnParty(s)).toBe(0);
    s = answerRight(s); // spirit acts: round ends, the foe strikes once
    expect(s.actor).toBe(0);
    expect(hitsOnParty(s)).toBe(1);
  });

  it('punishes a wrong answer with an immediate half-power counter on the one who missed', () => {
    let s = setup(21);
    s = reduce(s, { type: 'choose', move: 'kesa', now: NOW });
    s = reduce(s, { type: 'answer', value: '__wrong__', elapsedMs: 100, now: NOW });
    const counters = s.events.filter((e) => e.type === 'damage' && e.target === 'hero');
    // Solo hero: the counter, then the end-of-round attack.
    expect(counters).toHaveLength(2);
    const [counter, roundHit] = counters as Extract<BattleEvent, { type: 'damage' }>[];
    expect(counter!.amount).toBeLessThan(roundHit!.amount * 0.8);
  });

  it('is deterministic for a given seed', () => {
    expect(answerRight(setup(99))).toEqual(answerRight(setup(99)));
  });

  it('ignores actions that are invalid for the current phase', () => {
    const s = setup(1);
    expect(reduce(s, { type: 'answer', value: 'a', elapsedMs: 0, now: NOW })).toBe(s);
    expect(reduce(s, { type: 'choose', move: 'shuriken', now: NOW })).toBe(s); // not a samurai move
  });

  it('allows purifying a weakened wild foe by typing its true kana', () => {
    let s = setup(5);
    const foe = s.enemies[0] as Combatant;
    expect(canPurify(s)).toBe(false);
    s = { ...s, enemies: [{ ...foe, hp: 1 }] };
    expect(canPurify(s)).toBe(true);
    s = reduce(s, { type: 'purify' });
    expect(s.prompt?.kind).toBe('type');
    expect(s.prompt?.itemId).toBe(foe.trueKana);
    s = reduce(s, { type: 'answer', value: getKana(foe.trueKana!).romaji, elapsedMs: 0, now: NOW });
    expect(s.phase).toBe('recruited');
    expect(s.events).toContainEqual({ type: 'purify', target: 'foe1', familyId: 'kobi' });
  });

  it('lets a recruitable wild foe survive its first lethal blow at 1 HP, exactly once', () => {
    let s = setup(8);
    const foe = s.enemies[0] as Combatant;
    s = { ...s, enemies: [{ ...foe, hp: 2 }] };
    s = answerRight(s);
    expect(s.enemies[0]!.hp).toBe(1);
    expect(s.events).toContainEqual({ type: 'spared', target: 'foe1' });
    expect(canPurify(s)).toBe(true);
    s = answerRight(s);
    expect(s.phase).toBe('won');
  });

  it('does not spare bosses or named foes', () => {
    let s = setup(8);
    s = { ...s, enemies: [{ ...(s.enemies[0] as Combatant), familyId: undefined, hp: 2 }] };
    s = answerRight(s);
    expect(s.phase).toBe('won');
  });

  it('never lets you flee or purify a boss', () => {
    const s = { ...setup(3), isBoss: true };
    const fled = reduce(s, { type: 'flee' });
    expect(fled.phase).toBe('choose');
    expect(fled.events).toContainEqual({ type: 'flee', success: false });
    expect(canPurify({ ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 1 })) })).toBe(false);
  });
});
