import { describe, expect, it } from 'vitest';
import { ARC_STARTS, skipToArc, storyFlagsBefore } from '../save/skip';
import { newGame } from '../save/schema';
import { getMap } from '../world/maps';
import { isWalkable, visibleNpcs, warpAt } from '../world/types';

const fresh = () => ({ ...newGame('ninja', 'Tester', '2026-11-17', 1), srs: { 'h-a': { id: 'h-a', stage: 3, dueAt: 0, reps: 3, lapses: 0, lastSeenAt: 0 } } });
let n = 0;
const uid = () => `t${n++}`;

describe('tester: skip to an arc', () => {
  it('marks every earlier boss beaten and nothing from the arc itself', () => {
    const f2 = storyFlagsBefore(2);
    expect(f2).toContain('beat_oni');
    expect(f2).not.toContain('beat_champion');
    expect(storyFlagsBefore(4)).toEqual(expect.arrayContaining(['beat_oni', 'beat_champion', 'beat_shogun']));
    expect(storyFlagsBefore(5)).not.toContain('game_complete');
    expect(storyFlagsBefore(3).some((f) => f.startsWith('pass_') || f.startsWith('seal_'))).toBe(false);
  });

  it('levels the hero and a team of two, keeps what was learned, and lands on open ground', () => {
    for (const start of ARC_STARTS) {
      const save = skipToArc(fresh(), start, uid);
      expect(save.heroLevel).toBe(start.level);
      expect(save.party).toHaveLength(2);
      expect(save.party.every((p) => p.level === start.level - 1)).toBe(true);
      expect(save.srs['h-a']?.stage).toBe(3);
      const map = getMap(save.mapId);
      expect(isWalkable(map, save.x, save.y, save.flags), start.label).toBe(true);
      expect(warpAt(map, save.x, save.y)).toBeFalsy();
      expect(visibleNpcs(map, save.flags).some((p) => p.x === save.x && p.y === save.y)).toBe(false);
    }
  });

  it('never lowers a hero who is already further along', () => {
    const strong = { ...fresh(), heroLevel: 70, heroXp: 12 };
    const save = skipToArc(strong, ARC_STARTS[0]!, uid);
    expect(save.heroLevel).toBe(70);
    expect(save.heroXp).toBe(12);
  });
});
