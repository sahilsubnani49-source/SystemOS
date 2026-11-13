import { describe, expect, it } from 'vitest';
import { NATIVE_WORDS, WORDS } from '../content/words';
import { PHRASES } from '../content/phrases';
import { GRAMMAR, SENTENCES } from '../content/sentences';
import { TALES, TALE_PASSAGES, taleReadFlag } from '../content/tales';
import { PASSAGES } from '../content/passages';
import { FOCUS_FLAG, PUZZLES, focusPool, kanaTiles, puzzleSolution } from '../content/puzzles';
import { MOVES, type PromptKind } from '../content/moves';
import { poolForArea } from '../content/curriculum';
import { getItem } from '../content/items';
import { buildPrompt, gradeAnswer, resolveKind } from '../battle/prompts';
import { canFocus, reduce, startBattle, type BattleState } from '../battle/engine';
import { SURGE_CHARGES, computeDamage, surgeMultiplier } from '../battle/damage';
import { SEALS, foeCombatant, heroCombatant, sealBonus, spiritCombatant } from '../progression';
import { newGame } from '../save/schema';
import { getMap } from '../world/maps';
import { visibleNpcs } from '../world/types';
import { reviewPool } from '../srs/review';
import { createRng } from '../util/rng';

/** Hiragana, the long-vowel mark, Japanese punctuation, spaces and the blank. Nothing else. */
const HIRAGANA_ONLY = /^[ぁ-ゖー、。！？「」…・＿\s]+$/;
const WELL = ['well1', 'well2', 'well3', 'well4'];
const NOW = 1_800_000_000_000;

describe('the Well of Old Tales is hiragana only', () => {
  it('native words', () => {
    expect(NATIVE_WORDS.length).toBeGreaterThanOrEqual(50);
    for (const w of NATIVE_WORDS) expect(w.text, w.id).toMatch(HIRAGANA_ONLY);
    for (const key of ['id', 'text', 'meaning'] as const) expect(new Set(NATIVE_WORDS.map((w) => w[key])).size, key).toBe(NATIVE_WORDS.length);
    // They stay out of WORDS, whose meanings are unique across loanwords and kanji vocabulary.
    expect(WORDS.some((w) => w.kind === 'native')).toBe(false);
  });

  it('phrases', () => {
    expect(PHRASES.length).toBeGreaterThanOrEqual(16);
    for (const f of PHRASES) {
      expect(f.text, f.id).toMatch(HIRAGANA_ONLY);
      expect(new Set([f.meaning, ...f.wrong]).size, f.text).toBe(4);
    }
    expect(new Set(PHRASES.map((f) => f.meaning)).size).toBe(PHRASES.length);
  });

  it('grammar sentences, each with one blank, a rule and four distinct answers', () => {
    expect(GRAMMAR.length).toBeGreaterThanOrEqual(24);
    for (const g of GRAMMAR) {
      expect(g.text + g.answer + g.wrong.join(''), g.id).toMatch(HIRAGANA_ONLY);
      expect(g.text.split('＿＿').length - 1, g.text).toBe(1);
      expect(new Set([g.answer, ...g.wrong]).size, g.text).toBe(4);
      expect(g.note, g.text).toBeTruthy();
    }
    // The N4 exam set is untouched.
    expect(SENTENCES.some((s) => s.id.startsWith('g-'))).toBe(false);
  });

  it('folk tales and the questions about them', () => {
    expect(TALES.map((t) => t.id)).toEqual(['momotaro', 'urashima', 'tsuru', 'kaguya']);
    for (const t of TALES) {
      expect(t.titleJa).toMatch(HIRAGANA_ONLY);
      expect(t.pages.length).toBeGreaterThanOrEqual(6);
      for (const page of t.pages) {
        expect(page.ja, t.id).toMatch(HIRAGANA_ONLY);
        expect(page.en.length).toBeGreaterThan(10);
      }
      expect(TALE_PASSAGES.filter((q) => q.taleId === t.id), t.id).toHaveLength(2);
    }
    for (const q of TALE_PASSAGES) {
      expect(q.text, q.id).toMatch(HIRAGANA_ONLY);
      expect(q.question).toMatch(/^[\x20-\x7e]+\?$/);
      expect(new Set([q.answer, ...q.wrong]).size, q.text).toBe(4);
    }
    expect(PASSAGES.some((p) => p.id.startsWith('t-'))).toBe(false);
  });

  it('puzzles', () => {
    for (const p of PUZZLES) expect(puzzleSolution(p), p.id).toMatch(HIRAGANA_ONLY);
    for (const p of PUZZLES) {
      if (p.kind === 'riddle') expect(p.text + p.wrong.join(''), p.id).toMatch(HIRAGANA_ONLY);
      if (p.kind === 'oddOne') expect(p.others.join(''), p.id).toMatch(HIRAGANA_ONLY);
    }
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
  });
});

describe('FOCUS puzzles', () => {
  const rng = () => createRng(7);

  it('has all four kinds', () => {
    for (const kind of ['order', 'scramble', 'riddle', 'oddOne']) expect(PUZZLES.filter((p) => p.kind === kind).length, kind).toBeGreaterThanOrEqual(6);
  });

  it('order: the tiles rebuild the sentence, listed alternatives are accepted, anything else is wrong', () => {
    for (const p of PUZZLES) {
      if (p.kind !== 'order') continue;
      expect(new Set(p.tiles).size, p.id).toBe(p.tiles.length);
      const prompt = buildPrompt('arrange', p.id, [], rng(), null);
      expect(prompt.kind).toBe('arrange');
      expect([...prompt.tiles!].sort()).toEqual([...p.tiles].sort());
      expect(prompt.tiles, `${p.id} is handed over already solved`).not.toEqual(p.tiles);
      expect(gradeAnswer(prompt, p.tiles.join(''), 0)).toBe('correct');
      for (const order of p.alt) {
        expect([...order].sort(), p.id).toEqual(p.tiles.map((_, i) => i));
        expect(gradeAnswer(prompt, order.map((i) => p.tiles[i]).join(''), 0)).toBe('correct');
      }
      expect(gradeAnswer(prompt, [...p.tiles].reverse().join(''), 0)).toBe('wrong');
    }
  });

  it('scramble: no other native word can be built from the same kana', () => {
    const key = (text: string) => kanaTiles(text).sort().join('|');
    for (const p of PUZZLES) {
      if (p.kind !== 'scramble') continue;
      const word = getItem(p.wordId);
      if (word.kind !== 'word') throw new Error(p.id);
      const twins = NATIVE_WORDS.filter((w) => key(w.text) === key(word.word.text));
      expect(twins.map((w) => w.text), p.id).toEqual([word.word.text]);
      const prompt = buildPrompt('arrange', p.id, [], rng(), null);
      expect(prompt.tiles!.join('')).not.toBe(word.word.text);
      expect(prompt.display).toBe(word.word.meaning);
    }
  });

  it('keeps きょ and しゃ whole when splitting a word into tiles', () => {
    expect(kanaTiles('しゃしん')).toEqual(['しゃ', 'し', 'ん']);
    expect(kanaTiles('ともだち')).toEqual(['と', 'も', 'だ', 'ち']);
  });

  it('riddles and odd-one-out offer four distinct choices, never timed', () => {
    for (const p of PUZZLES) {
      if (p.kind !== 'riddle' && p.kind !== 'oddOne') continue;
      const prompt = buildPrompt('riddle', p.id, [], rng(), 3000);
      expect(prompt.kind).toBe('riddle');
      expect(new Set(prompt.choices).size, p.id).toBe(4);
      expect(prompt.choices).toContain(prompt.answer);
      expect(prompt.timeLimitMs).toBeNull();
    }
  });

  it('is locked until Grandmother Fumi teaches it', () => {
    expect(focusPool({})).toEqual([]);
    expect(focusPool({ [FOCUS_FLAG]: true })).toHaveLength(PUZZLES.length);
  });
});

describe('well pools', () => {
  it.each(WELL)('%s builds a four-choice or typed prompt for every move, on every item', (area) => {
    const pool = poolForArea(area);
    expect(pool.length).toBeGreaterThanOrEqual(20);
    expect(pool.some((id) => id.startsWith('h-') || id.startsWith('k-') || id.startsWith('j-'))).toBe(false);
    const kinds = [...new Set(Object.values(MOVES).map((m) => m.prompt))] as PromptKind[];
    const rng = createRng(11);
    for (const id of pool) {
      for (const kind of kinds) {
        const p = buildPrompt(kind, id, pool, rng, null);
        expect(p.kind, `${id} ${kind}`).toBe(resolveKind(kind, id));
        if (p.kind !== 'type') {
          expect(new Set(p.choices).size, `${id} ${kind}: ${p.choices.join(' / ')}`).toBe(4);
          expect(p.choices).toContain(p.answer);
        }
      }
    }
  });

  it('asks a hiragana word for its meaning or spelling, never for a "reading" it already shows', () => {
    for (const kind of ['reading', 'type', 'mirror'] as const) expect(resolveKind(kind, 'n-inu')).toBe('meaning');
    expect(resolveKind('recall', 'n-inu')).toBe('spell');
    expect(resolveKind('recognize', 'f-1')).toBe('meaning');
    expect(resolveKind('recognize', 'g-1')).toBe('context');
    expect(resolveKind('recognize', 't-1')).toBe('passage');
  });

  it('each floor asks about its own tale; the bottom asks about all four', () => {
    const tales = (area: string) => poolForArea(area).filter((id) => id.startsWith('t-'));
    expect(tales('well1')).toEqual(['t-1', 't-2']);
    expect(tales('well3')).toEqual(['t-5', 't-6']);
    expect(tales('well4')).toHaveLength(TALE_PASSAGES.length);
  });

  it('survives the Daily Trial: well items in the SRS table resolve like any other', () => {
    const srs = Object.fromEntries(['n-inu', 'f-1', 'g-1', 't-1', 'z-o1', 'z-r1'].map((id) => [id, { id, stage: 0, dueAt: 0, reps: 1, lapses: 1, lastSeenAt: 1 }]));
    const pool = reviewPool(srs, NOW);
    expect(pool).toHaveLength(6);
    for (const id of pool) expect(() => buildPrompt('recognize', id, pool, createRng(1), null)).not.toThrow();
  });
});

describe('FOCUS and the spirit surge', () => {
  const battle = (focus: boolean): BattleState => {
    const pool = poolForArea('well1');
    const save = { ...newGame('samurai', 'Ren', 'x', 1), heroLevel: 20 };
    const foe = foeCombatant({ familyId: 'riki', level: 20, hpScale: 30, recruitable: false }, 'f', pool, createRng(1));
    return startBattle({
      party: [heroCombatant(save), spiritCombatant({ uid: 's1', familyId: 'kobi', level: 20, xp: 0 }, {})],
      enemies: [{ ...foe, atk: 1 }], kanaPool: pool, focusPool: focus ? focusPool({ [FOCUS_FLAG]: true }) : [], srs: {}, isBoss: true, seed: 5,
    });
  };
  const solve = (s: BattleState, right = true) => reduce(s, { type: 'answer', value: right ? s.prompt!.answer : 'x', elapsedMs: 500, now: NOW });
  const attack = (s: BattleState) => {
    const move = s.party[s.actor]!.moves.find((m) => MOVES[m].power > 0)!;
    return solve(reduce(s, { type: 'choose', move, now: NOW }));
  };

  it('is not offered before it is learned', () => {
    const s = battle(false);
    expect(canFocus(s)).toBe(false);
    expect(reduce(s, { type: 'focus', now: NOW })).toBe(s);
  });

  it('asks a puzzle, and a solved one charges the party', () => {
    let s = reduce(battle(true), { type: 'focus', now: NOW });
    expect(s.phase).toBe('answer');
    expect(['arrange', 'riddle']).toContain(s.prompt!.kind);
    expect(s.prompt!.itemId.startsWith('z-')).toBe(true);
    s = solve(s);
    expect(s.surge).toBe(SURGE_CHARGES);
    expect(s.events).toContainEqual({ type: 'surge', charges: SURGE_CHARGES });
    expect(s.actor).toBe(1); // it cost the turn
    expect(s.combo).toBe(1);
  });

  it('spends one charge per party hit, marks those hits, and cannot be stacked', () => {
    let s = solve(reduce(battle(true), { type: 'focus', now: NOW }));
    expect(canFocus(s)).toBe(false);
    for (let left = SURGE_CHARGES; left > 0; left--) {
      expect(s.surge).toBe(left);
      s = attack(s);
      expect(s.events.find((e) => e.type === 'damage' && e.target === 'f')).toMatchObject({ surged: true });
    }
    expect(s.surge).toBe(0);
    s = attack(s);
    expect(s.events.find((e) => e.type === 'damage' && e.target === 'f')).toMatchObject({ surged: false });
    expect(canFocus(s)).toBe(true);
  });

  it('a failed puzzle charges nothing and is countered', () => {
    const s = solve(reduce(battle(true), { type: 'focus', now: NOW }), false);
    expect(s.surge).toBe(0);
    expect(s.combo).toBe(0);
    expect(s.events.some((e) => e.type === 'damage' && e.target === 'hero')).toBe(true);
  });

  it('a surge is never wasted on the foe: enemy hits are not surged', () => {
    let s = solve(reduce(battle(true), { type: 'focus', now: NOW }));
    s = attack(s); // spirit attacks, then the foe's round
    const foeHit = s.events.find((e) => e.type === 'damage' && e.target !== 'f');
    expect(foeHit).toMatchObject({ surged: false });
    expect(s.surge).toBe(SURGE_CHARGES - 1);
  });

  it('makes a charged hit land harder (surgeMultiplier)', () => {
    const base = { atk: 40, def: 20, power: 1.2, level: 20, attackElement: 'steel', defendElement: 'steel', combo: 0, comboStep: 0.1, crit: false, variance: 1 } as const;
    for (let left = SURGE_CHARGES; left >= 1; left--) {
      const m = surgeMultiplier(left);
      expect(m, `charge ${left}`).toBeGreaterThan(1);
      expect(m, `charge ${left}: a surge should not one-shot bosses`).toBeLessThanOrEqual(4);
      expect(computeDamage({ ...base, surge: m })).toBeGreaterThan(computeDamage(base));
    }
  });
});

describe('seals', () => {
  it('are small, permanent, and add up', () => {
    expect(sealBonus({})).toEqual({ atk: 1, def: 1, hp: 1 });
    const all = sealBonus(Object.fromEntries(SEALS.map((s) => [s.flag, true])));
    for (const v of Object.values(all)) {
      expect(v).toBeGreaterThan(1.05);
      expect(v).toBeLessThanOrEqual(1.1);
    }
  });

  it('strengthen the hero and every spirit', () => {
    const plain = { ...newGame('ninja', 'Ren', 'x', 1), heroLevel: 20 };
    const flags = { seal_words: true, seal_heart: true, seal_rules: true };
    const blessed = { ...plain, flags };
    expect(heroCombatant(blessed).atk).toBeGreaterThan(heroCombatant(plain).atk);
    expect(heroCombatant(blessed).def).toBeGreaterThan(heroCombatant(plain).def);
    expect(heroCombatant(blessed).maxHp).toBeGreaterThan(heroCombatant(plain).maxHp);
    const owned = { uid: 's', familyId: 'riki', level: 20, xp: 0 };
    expect(spiritCombatant(owned, {}, flags).maxHp).toBeGreaterThan(spiritCombatant(owned, {}).maxHp);
    expect(spiritCombatant(owned, {}, flags).spd).toBe(spiritCombatant(owned, {}).spd);
  });
});

describe('the well itself', () => {
  const FLOORS = [
    { map: 'well_words', tale: 'momotaro', boss: 'momotaro', seal: 'seal_words' },
    { map: 'well_heart', tale: 'urashima', boss: 'urashima', seal: 'seal_heart' },
    { map: 'well_rules', tale: 'tsuru', boss: 'tsuru', seal: 'seal_rules' },
    { map: 'well_deep', tale: 'kaguya', boss: 'nanashi', seal: 'seal_deep' },
  ];

  it.each(FLOORS)('$map: the guardian appears only after its tale is read, and leaves a seal', ({ map, tale, boss, seal }) => {
    const m = getMap(map);
    const ids = (flags: Record<string, boolean>) => visibleNpcs(m, flags).map((n) => n.id);
    expect(m.def.npcs.find((n) => n.id === `keeper_${tale}`)?.readsTale).toBe(tale);
    expect(ids({})).toEqual([`keeper_${tale}`]);
    expect(ids({ [taleReadFlag(tale)]: true })).toContain(boss);
    expect(ids({ [taleReadFlag(tale)]: true, [seal]: true })).not.toContain(boss);
    expect(m.def.npcs.find((n) => n.id === boss)?.battle).toMatchObject({ winFlag: seal, isBoss: true });
    // closeBattle() plays the dialogue of the NPC whose showIf is the win flag.
    expect(m.def.npcs.filter((n) => n.showIf === seal)).toHaveLength(1);
    expect(SEALS.map((s) => s.flag)).toContain(seal);
  });

  it('Fumi teaches FOCUS at the well mouth, after the Oni', () => {
    const village = getMap('sakura_village');
    expect(visibleNpcs(village, { starter: true }).map((n) => n.id)).not.toContain('fumi');
    const fumi = visibleNpcs(village, { starter: true, beat_oni: true }).find((n) => n.id === 'fumi')!;
    expect(fumi.setsFlag).toBe(FOCUS_FLAG);
    expect(visibleNpcs(village, { beat_oni: true, seal_deep: true }).map((n) => n.id)).toContain('fumi_after');
  });
});

describe('is FOCUS worth a turn?', () => {
  it('three surged hits out-damage the four plain hits the turn would have bought', () => {
    const total = [3, 2, 1].reduce((sum, left) => sum + surgeMultiplier(left), 0);
    expect(total).toBeGreaterThan(SURGE_CHARGES + 1);
    expect(surgeMultiplier(3)).toBeGreaterThan(surgeMultiplier(1));
  });
});
