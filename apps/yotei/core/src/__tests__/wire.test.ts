import { describe, expect, it } from 'vitest';
import { draftFromWire } from '../wire';

describe('draftFromWire', () => {
  it('maps snake_case to camelCase and moves items with an unknown unit to unscheduled', () => {
    const d = draftFromWire({
      plan: { title: 'P', boundary_quote: '3 days', horizon: { unit: 'day', length: 3 }, start_date: null, end_date: null },
      items: [
        { quote: 'A', period_quote: 'Day 1', period: { unit: 'day', index: 1, time_start: '09:00', time_end: '10:00' } },
        { quote: 'B', period_quote: 'Fortnight 1', period: { unit: 'fortnight', index: 1 } },
      ],
      rejected: [{ quote: 'X', reason: 'Not found in the planner' }],
      unscheduled: [],
      unassigned_lines: ['C'],
    });
    expect(d.horizon).toEqual({ unit: 'day', length: 3 });
    expect(d.items).toEqual([
      { quote: 'A', periodQuote: 'Day 1', period: { unit: 'day', index: 1, weekday: null, date: null, endDate: null, timeStart: '09:00', timeEnd: '10:00' } },
    ]);
    expect(d.unscheduled).toEqual([{ quote: 'B', reason: 'Unreadable timing' }]);
    expect(d.unassignedLines).toEqual(['C']);
  });
});
