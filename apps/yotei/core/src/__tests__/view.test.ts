import { describe, expect, it } from 'vitest';
import { resolvePlan } from '../resolve';
import { currentView } from '../view';
import type { DraftItem, PlanDraft } from '../types';

let n = 0;
const items: DraftItem[] = [
  { quote: 'W1 read', periodQuote: 'Week 1', period: { unit: 'week', index: 1 } },
  { quote: 'W1 Fri gym 18:00', periodQuote: 'Fri', period: { unit: 'week', index: 1, weekday: 5, timeStart: '18:00', timeEnd: '19:00' } },
  { quote: 'W2 write', periodQuote: 'Week 2', period: { unit: 'week', index: 2 } },
  { quote: 'W3 ship', periodQuote: 'Week 3', period: { unit: 'week', index: 3 } },
];
const draft: PlanDraft = {
  title: '3-week sprint', boundaryQuote: '3-week sprint', horizon: { unit: 'week', length: 3 },
  startDate: null, endDate: null, items, rejected: [], unscheduled: [], unassignedLines: [],
};
const { plan, items: planItems } = resolvePlan(draft, {
  startDate: '2026-11-02', timezone: 'UTC', sourceMd: '', makeId: () => `i${++n}`, nowIso: '',
});
const byText = (list: { text: string }[]) => list.map((i) => i.text);

describe('currentView', () => {
  it('shows week 1 before and at the start, with the time-boxed slot current only during it', () => {
    expect(currentView(plan, planItems, '2026-10-30T12:00').phase).toBe('before');
    const mon = currentView(plan, planItems, '2026-11-02T08:00');
    expect(mon.window).toMatchObject({ kind: 'week', index: 1, total: 3, start: '2026-11-02T00:00' });
    expect(byText(mon.current)).toEqual(['W1 read']);
    expect(byText(mon.later)).toEqual(['W1 Fri gym 18:00']);
    expect(byText(mon.upNext)).toEqual(['W2 write', 'W3 ship']);
    expect(mon.nextChange).toBe('2026-11-06T18:00'); // the gym slot starts
    const fri = currentView(plan, planItems, '2026-11-06T18:30');
    expect(byText(fri.current)).toEqual(['W1 read', 'W1 Fri gym 18:00']);
  });

  it('rolls over to the next week at local midnight and keeps undone work as overdue', () => {
    const sun = currentView(plan, planItems, '2026-11-08T23:59');
    expect(sun.window.index).toBe(1);
    const mon = currentView(plan, planItems, '2026-11-09T00:00');
    expect(mon.window).toMatchObject({ index: 2, start: '2026-11-09T00:00' });
    expect(byText(mon.current)).toEqual(['W2 write']);
    expect(byText(mon.overdue)).toEqual(['W1 read', 'W1 Fri gym 18:00']);
  });

  it('keeps done items in their week and out of overdue', () => {
    const done = planItems.map((i) => (i.text === 'W1 read' ? { ...i, doneAt: '2026-11-03T10:00:00Z' } : i));
    const mon2 = currentView(plan, done, '2026-11-09T09:00');
    expect(byText(mon2.overdue)).toEqual(['W1 Fri gym 18:00']);
  });

  it('shows the final week, and everything left undone, after the plan ends', () => {
    const after = currentView(plan, planItems, '2026-12-01T10:00');
    expect(after.phase).toBe('finished');
    expect(after.window.index).toBe(3);
    expect(byText(after.overdue)).toEqual(['W1 read', 'W1 Fri gym 18:00', 'W2 write', 'W3 ship']);
  });
});
