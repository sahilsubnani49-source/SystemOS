import { describe, expect, it } from 'vitest';
import { MAX_STAGE, STAGE_INTERVAL_MS, isMastered, newItem, recordAnswer, review } from '../srs/schedule';
import { pickNextPrompt } from '../srs/pickNextPrompt';
import { createRng } from '../util/rng';

const NOW = 1_800_000_000_000;

describe('SRS schedule', () => {
  it('climbs one stage per correct answer and waits the stage interval', () => {
    let item = newItem('h-a', NOW);
    for (let stage = 1; stage <= MAX_STAGE; stage++) {
      item = review(item, true, NOW);
      expect(item.stage).toBe(stage);
      expect(item.dueAt).toBe(NOW + (STAGE_INTERVAL_MS[stage] as number));
    }
    expect(isMastered(item)).toBe(true);
    expect(review(item, true, NOW).stage).toBe(MAX_STAGE);
  });

  it('drops two stages and becomes due immediately on a miss', () => {
    const item = { ...newItem('h-a', NOW), stage: 4, dueAt: NOW + 999 };
    const after = review(item, false, NOW);
    expect(after.stage).toBe(2);
    expect(after.dueAt).toBe(NOW);
    expect(after.lapses).toBe(1);
    expect(review({ ...item, stage: 1 }, false, NOW).stage).toBe(0);
  });

  it('creates items on first answer without mutating the input table', () => {
    const table = {};
    const next = recordAnswer(table, 'h-ka', true, NOW);
    expect(table).toEqual({});
    expect(next['h-ka']?.stage).toBe(1);
  });
});

describe('pickNextPrompt', () => {
  it('prefers overdue lapsed items, then due, then new, then low-stage', () => {
    const rng = createRng(1);
    const table = {
      'h-a': { ...newItem('h-a', NOW), stage: 3, dueAt: NOW + 1e9 }, // not due
      'h-i': { ...newItem('h-i', NOW), stage: 2, dueAt: NOW - 1 }, // due
      'h-u': { ...newItem('h-u', NOW), stage: 2, dueAt: NOW - 1, lapses: 2 }, // due + lapsed
    };
    expect(pickNextPrompt(['h-a', 'h-i', 'h-u', 'h-e'], table, NOW, rng)).toBe('h-u');
    expect(pickNextPrompt(['h-a', 'h-i', 'h-e'], table, NOW, rng)).toBe('h-i');
    expect(pickNextPrompt(['h-a', 'h-e'], table, NOW, rng)).toBe('h-e');
    expect(pickNextPrompt(['h-a'], table, NOW, rng)).toBe('h-a');
  });

  it('avoids repeating the previous prompt when there is any alternative', () => {
    const rng = createRng(7);
    for (let i = 0; i < 20; i++) {
      expect(pickNextPrompt(['h-a', 'h-i'], {}, NOW, rng, 'h-a')).toBe('h-i');
    }
    expect(pickNextPrompt(['h-a'], {}, NOW, rng, 'h-a')).toBe('h-a');
  });
});
