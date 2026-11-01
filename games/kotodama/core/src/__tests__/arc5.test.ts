import { describe, expect, it } from 'vitest';
import { kanjiInGroup } from '../content/kanji';
import { PASSAGES } from '../content/passages';
import { CURRICULUM, poolForArea } from '../content/curriculum';
import { buildPrompt, resolveKind } from '../battle/prompts';
import { SPIRIT_FAMILIES, familyItemIds } from '../content/spirits';
import { familyStage, foeCombatant, spiritCombatant } from '../progression';
import { reduce, startBattle } from '../battle/engine';
import { itemReading, itemText } from '../content/items';
import { MAX_STAGE, newItem, type SrsTable } from '../srs/schedule';
import { REVIEW_AREA, battlePool, reviewPool } from '../srs/review';
import { createRng } from '../util/rng';

const N3_AREAS = ['coast', 'glacier', 'forge', 'valor', 'runeforge'];
const HOUR = 3_600_000;

describe('passage prompts', () => {
  it('shows the passage with its English question as a hint, untimed, with four English choices', () => {
    const p = PASSAGES[0]!;
    const prompt = buildPrompt('passage', p.id, poolForArea('coast'), createRng(2), 4000);
    expect(prompt.kind).toBe('passage');
    expect(prompt.display).toBe(p.text);
    expect(prompt.hint).toBe(p.question);
    expect(prompt.speak).toBe(p.text);
    expect(prompt.timeLimitMs).toBeNull();
    expect(new Set(prompt.choices)).toEqual(new Set([p.answer, ...p.wrong]));
    expect(itemText(p.id)).toBe(p.text);
    expect(itemReading(p.id)).toBe(p.text);
  });

  it('maps every move onto a passage as a passage, and a passage move onto other items sensibly', () => {
    for (const k of ['recognize', 'recall', 'type', 'mirror', 'context'] as const) expect(resolveKind(k, 'p-1')).toBe('passage');
    expect(resolveKind('passage', 'c-1')).toBe('context');
    expect(resolveKind('passage', 'j-水')).toBe('meaning');
    expect(resolveKind('passage', 'h-ka')).toBe('recognize');
  });

  it('Rune Scroll always asks a passage when the area has passages', () => {
    const pool = poolForArea('coast');
    const volva = spiritCombatant({ uid: 'v', familyId: 'volva', level: 60, xp: 0 }, {});
    expect(volva.moves).toContain('runeScroll');
    const foe = foeCombatant({ familyId: 'einherjar', level: 60, hpScale: 30 }, 'f', pool, createRng(1));
    let s = startBattle({ party: [volva], enemies: [{ ...foe, atk: 1 }], kanaPool: pool, srs: {}, seed: 5 });
    for (let i = 0; i < 6; i++) {
      s = reduce(s, { type: 'choose', move: 'runeScroll', now: 0 });
      expect(s.prompt?.kind, `round ${i}`).toBe('passage');
      s = reduce(s, { type: 'answer', value: s.prompt!.answer, elapsedMs: 500, now: 0 });
    }
  });
});

describe('Norse rune spirits', () => {
  const n3 = SPIRIT_FAMILIES.filter((f) => f.kanjiGroup?.startsWith('n3'));

  it('has one family per N3 group, each named with a kanji from its own group', () => {
    expect(n3).toHaveLength(10);
    expect(new Set(n3.map((f) => f.kanjiGroup)).size).toBe(10);
    for (const f of n3) {
      const chars = kanjiInGroup(f.kanjiGroup!).map((k) => k.char);
      for (const st of f.stages) expect([...st.nameJa].some((c) => chars.includes(c)), `${f.id}: ${st.nameJa}`).toBe(true);
    }
  });

  it('evolves from mastery of its N3 group, and its true name is one of them', () => {
    const f = n3.find((x) => x.id === 'jotunn')!;
    const mastered = Object.fromEntries(familyItemIds(f).map((id) => [id, { id, stage: MAX_STAGE, dueAt: 0, reps: 5, lapses: 0, lastSeenAt: 0 }]));
    expect(familyStage(f.id, {})).toBe(0);
    expect(familyStage(f.id, mastered)).toBe(2);
    const foe = foeCombatant({ familyId: 'jotunn', level: 60 }, 'f', poolForArea('forge'), createRng(3));
    expect(familyItemIds(f)).toContain(foe.trueName);
  });
});

describe('N3 curriculum', () => {
  it('runs coast → runeforge with cumulative N3 groups, then a finale over everything', () => {
    let prev = 0;
    for (const a of N3_AREAS) {
      const c = CURRICULUM[a]!;
      expect(c.arc).toBe(5);
      expect(c.kanji!.length).toBeGreaterThan(prev);
      prev = c.kanji!.length;
      expect(poolForArea(a).some((id) => id.startsWith('p-')), a).toBe(true);
    }
    const finale = poolForArea('finale');
    for (const p of PASSAGES) expect(finale).toContain(p.id);
    expect(finale.filter((id) => id.startsWith('j-')).length).toBeGreaterThanOrEqual(140);
  });
});

describe('Daily Trial pool', () => {
  const now = 1_000 * HOUR;
  const seen = (id: string, stage: number, dueAt: number, lapses = 0) => ({ ...newItem(id, 0), stage, dueAt, lapses, reps: 3, lastSeenAt: 1 });

  it('puts due items first (lapsed, then most overdue), never repeats, and respects the limit', () => {
    const srs: SrsTable = {
      'h-ka': seen('h-ka', 3, now - 1 * HOUR),
      'j-水': seen('j-水', 2, now - 50 * HOUR),
      'v-gakusei': seen('v-gakusei', 1, now - 2 * HOUR, 1),
      'p-1': seen('p-1', 4, now + 24 * HOUR),
    };
    const pool = reviewPool(srs, now, 3);
    expect(pool).toEqual(['v-gakusei', 'j-水', 'h-ka']);
  });

  it('tops up with the weakest seen items when few are due, with no duplicates', () => {
    const srs: SrsTable = {
      'h-ka': seen('h-ka', 1, now - HOUR),
      'h-ki': seen('h-ki', 5, now + 99 * HOUR),
      'k-ka': seen('k-ka', 2, now + 9 * HOUR),
      'j-水': seen('j-水', 3, now + 9 * HOUR),
    };
    const pool = reviewPool(srs, now);
    expect(pool[0]).toBe('h-ka');
    expect(pool).toEqual(['h-ka', 'k-ka', 'j-水', 'h-ki']);
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('skips stale ids and never returns an empty pool', () => {
    const srs: SrsTable = { 'v-nosuchword': seen('v-nosuchword', 0, 0), 'h-ka': newItem('h-ka', 0) };
    const pool = reviewPool(srs, now);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool).not.toContain('v-nosuchword');
  });

  it('battlePool routes the review area to the SRS table and others to the curriculum', () => {
    const srs: SrsTable = { 'j-水': seen('j-水', 0, 0) };
    expect(battlePool(REVIEW_AREA, srs, now)).toContain('j-水');
    expect(battlePool('coast', srs, now)).toEqual(poolForArea('coast'));
  });
});
