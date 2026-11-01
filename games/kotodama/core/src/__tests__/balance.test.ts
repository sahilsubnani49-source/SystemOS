import { describe, expect, it } from 'vitest';
import { ALL_MAPS } from '../world/maps';
import { reduce, startBattle, type BattleState } from '../battle/engine';
import { poolForArea } from '../content/curriculum';
import { getItem } from '../content/items';
import { foeCombatant, heroCombatant, spiritCombatant } from '../progression';
import { newGame } from '../save/schema';
import { createRng } from '../util/rng';

const NOW = 1_800_000_000_000;

/** Correct answers a well-levelled party needs to beat a boss with perfect play. */
function answersToWin(foeLevel: number, foes: Parameters<typeof foeCombatant>[0][], area: string, hero: 'samurai' | 'ninja', seed: number): number {
  const level = Math.max(1, foeLevel - 2);
  const save = { ...newGame(hero, 'Ren', 'x', 1), heroLevel: level, flags: { learned_mirror: foeLevel > 16 } };
  const pool = poolForArea(area);
  const rng = createRng(seed);
  const party = [
    heroCombatant(save),
    spiritCombatant({ uid: 's1', familyId: 'riki', level: level - 1, xp: 0 }, {}),
    spiritCombatant({ uid: 's2', familyId: 'kobi', level: level - 1, xp: 0 }, {}),
  ];
  let s: BattleState = startBattle({ party, enemies: foes.map((f, i) => foeCombatant(f, `f${i}`, pool, rng)), kanaPool: pool, srs: {}, isBoss: true, seed });
  let answers = 0;
  while (s.phase === 'choose' && answers < 200) {
    const actor = s.party[s.actor]!;
    const move = actor.moves.find((m) => !['stance', 'smoke', 'guardian', 'mend'].includes(m)) ?? actor.moves[0]!;
    s = reduce(s, { type: 'choose', move, now: NOW });
    const p = s.prompt!;
    const value = p.kind === 'type' ? (getItem(p.itemId).kind === 'kana' ? p.answer : p.answer) : p.answer;
    s = reduce(s, { type: 'answer', value, elapsedMs: 900, now: NOW });
    answers++;
  }
  expect(s.phase).toBe('won');
  return answers;
}

const BOSSES = ALL_MAPS.flatMap((m) =>
  m.npcs.filter((n) => n.battle).map((n) => ({ id: n.id, area: n.battle!.pool ?? m.area, foes: n.battle!.foes })),
);

describe('boss pacing', () => {
  it.each(BOSSES.map((b) => [b.id, b]))('%s takes 8–20 correct answers for a party of the expected level', (_id, b) => {
    const results = (['samurai', 'ninja'] as const).map((hero) => {
      const runs = [1, 2, 3].map((seed) => answersToWin(b.foes[0]!.level, b.foes, b.area, hero, seed));
      return { hero, runs, avg: runs.reduce((x, y) => x + y, 0) / runs.length };
    });
    const label = results.map((r) => `${r.hero} ${r.runs.join(',')}`).join(' | ');
    if (process.env.BALANCE_LOG) console.log(`${b.id}: ${label}`);
    for (const r of results) {
      expect(r.avg, `${b.id}: ${label}`).toBeGreaterThanOrEqual(8);
      expect(r.avg, `${b.id}: ${label}`).toBeLessThanOrEqual(20);
    }
  });
});
