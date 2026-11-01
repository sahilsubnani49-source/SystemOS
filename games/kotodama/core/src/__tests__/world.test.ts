import { describe, expect, it } from 'vitest';
import { isWalkable, parseMap, rollEncounter, type MapDef } from '../world/types';
import { applyXp, familyStage, horseSpeed, nextStreak, xpToNext } from '../progression';
import { migrateSave, newGame } from '../save/schema';
import { kanaWhere } from '../content/kana';
import { MAX_STAGE } from '../srs/schedule';
import { createRng } from '../util/rng';

const def: MapDef = {
  id: 't', name: 'Test', nameJa: 'テスト', area: 'dojo',
  rows: ['TTT', 'T,T', 'T.T'],
  warps: [], npcs: [{ id: 'n', x: 1, y: 2, sprite: 'x', facing: 'up', dialogue: [], hideIf: 'gone' }],
  encounterRate: 1, encounters: [{ familyId: 'akari', weight: 1, levels: [1, 2] }],
  music: 'm', weather: 'none', rideable: false,
};

describe('world', () => {
  it('rejects ragged maps and unknown tiles', () => {
    expect(() => parseMap({ ...def, rows: ['TT', 'T'] })).toThrow(/wide/);
    expect(() => parseMap({ ...def, rows: ['T?T'] })).toThrow(/unknown tile/);
  });

  it('blocks solid tiles and visible NPCs', () => {
    const map = parseMap(def);
    expect(isWalkable(map, 0, 0, {})).toBe(false);
    expect(isWalkable(map, 1, 1, {})).toBe(true);
    expect(isWalkable(map, 1, 2, {})).toBe(false);
    expect(isWalkable(map, 1, 2, { gone: true })).toBe(true);
    expect(isWalkable(map, -1, 0, {})).toBe(false);
  });

  it('rolls encounters only on encounter tiles', () => {
    const map = parseMap(def);
    expect(rollEncounter(map, 1, 1, createRng(1), false)?.familyId).toBe('akari');
    expect(rollEncounter(map, 1, 2, createRng(1), false)).toBeNull();
  });
});

describe('progression', () => {
  it('levels up across several thresholds at once', () => {
    const r = applyXp(1, 0, xpToNext(1) + xpToNext(2) + 3);
    expect(r).toEqual({ level: 3, xp: 3, levelsGained: 2 });
  });

  it('evolves a spirit from row mastery, not XP', () => {
    const vowels = kanaWhere({ script: 'hiragana', row: 'a', kind: 'basic' });
    const mastered = Object.fromEntries(vowels.map((k) => [k.id, { id: k.id, stage: MAX_STAGE, dueAt: 0, reps: 5, lapses: 0, lastSeenAt: 0 }]));
    expect(familyStage('akari', {})).toBe(0);
    expect(familyStage('akari', mastered)).toBe(2);
  });

  it('tracks the study streak and horse speed', () => {
    expect(nextStreak(null, 0, '2026-11-01')).toBe(1);
    expect(nextStreak('2026-10-31', 4, '2026-11-01')).toBe(5);
    expect(nextStreak('2026-11-01', 5, '2026-11-01')).toBe(5);
    expect(nextStreak('2026-10-20', 9, '2026-11-01')).toBe(1);
    expect(horseSpeed(1)).toBe(1.5);
    expect(horseSpeed(30)).toBe(3);
  });
});

describe('save migration', () => {
  it('rejects junk and fills fields missing from older saves', () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave({ version: 99 })).toBeNull();
    const old = { ...newGame('ninja', 'Aki', 'x', 1) } as Record<string, unknown>;
    delete old.horse;
    expect(migrateSave(old)?.horse.owned).toBe(false);
    expect(migrateSave(old)?.hero).toBe('ninja');
  });
});
