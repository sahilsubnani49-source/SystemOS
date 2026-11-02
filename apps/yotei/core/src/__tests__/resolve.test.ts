import { describe, expect, it } from 'vitest';
import { NoTimeLimitError, resolvePlan, type ResolveOptions } from '../resolve';
import type { DraftItem, PlanDraft } from '../types';

let n = 0;
const opts = (over: Partial<ResolveOptions> = {}): ResolveOptions => ({
  startDate: '2026-11-04', // a Wednesday
  timezone: 'Asia/Kolkata',
  sourceMd: '# plan',
  makeId: () => `id${++n}`,
  nowIso: '2026-11-04T00:00:00Z',
  ...over,
});
const draft = (over: Partial<PlanDraft>, items: DraftItem[]): PlanDraft => ({
  title: 'Plan',
  boundaryQuote: '12-week plan',
  horizon: { unit: 'week', length: 12 },
  startDate: null,
  endDate: null,
  items,
  rejected: [],
  unscheduled: [],
  unassignedLines: [],
  ...over,
});
const it_ = (quote: string, period: DraftItem['period']): DraftItem => ({ quote, periodQuote: 'x', period });

describe('resolvePlan', () => {
  it('refuses a planner with no time limit instead of inventing one', () => {
    expect(() => resolvePlan(draft({ boundaryQuote: '' }, []), opts())).toThrow(NoTimeLimitError);
    expect(() => resolvePlan(draft({ horizon: null }, []), opts())).toThrow(NoTimeLimitError);
  });

  it('places relative weeks from the chosen start date, and a weekday inside its plan week', () => {
    const { plan, items } = resolvePlan(
      draft({}, [
        it_('Week 1 task', { unit: 'week', index: 1 }),
        it_('Week 3 task', { unit: 'week', index: 3 }),
        it_('Week 2 Monday', { unit: 'week', index: 2, weekday: 1, timeStart: '09:00', timeEnd: '11:00' }),
      ]),
      opts(),
    );
    expect(plan.start).toBe('2026-11-04T00:00');
    expect(plan.end).toBe('2027-01-27T00:00'); // 12 weeks later
    const byText = Object.fromEntries(items.map((i) => [i.text, i]));
    expect(byText['Week 1 task']).toMatchObject({ start: '2026-11-04T00:00', end: '2026-11-11T00:00', timed: false });
    expect(byText['Week 3 task']!.start).toBe('2026-11-18T00:00');
    // Plan week 2 = Wed 11 Nov .. Tue 17 Nov; its Monday is 16 Nov.
    expect(byText['Week 2 Monday']).toMatchObject({ start: '2026-11-16T09:00', end: '2026-11-16T11:00', timed: true });
  });

  it('handles days with clock slots, slots crossing midnight, and hour plans', () => {
    const { items } = resolvePlan(
      draft({ horizon: { unit: 'day', length: 3 } }, [
        it_('Day 2 focus', { unit: 'day', index: 2, timeStart: '14:00', timeEnd: '16:00' }),
        it_('Night shift', { unit: 'day', index: 3, timeStart: '22:00', timeEnd: '01:00' }),
      ]),
      opts(),
    );
    expect(items.map((i) => [i.start, i.end])).toEqual([
      ['2026-11-05T14:00', '2026-11-05T16:00'],
      ['2026-11-06T22:00', '2026-11-07T01:00'],
    ]);
    const hours = resolvePlan(
      draft({ horizon: { unit: 'hour', length: 4 } }, [it_('Hour 2', { unit: 'hour', index: 2 })]),
      opts({ startTime: '09:00' }),
    );
    expect(hours.plan.end).toBe('2026-11-04T13:00');
    expect(hours.items[0]).toMatchObject({ start: '2026-11-04T10:00', end: '2026-11-04T11:00' });
  });

  it('ignores a start time for plans not counted in hours (regression: week 1 rejected)', () => {
    const { plan, items, problems } = resolvePlan(
      draft({ horizon: { unit: 'week', length: 3 } }, [it_('Week 1 task', { unit: 'week', index: 1 })]),
      opts({ startDate: '2026-11-02', startTime: '09:00' }),
    );
    expect(problems).toEqual([]);
    expect(plan.start).toBe('2026-11-02T00:00');
    expect(plan.end).toBe('2026-11-23T00:00');
    expect(items[0]!.start).toBe('2026-11-02T00:00');
  });

  it('uses absolute dates as written, and month/year spans by calendar', () => {
    const { plan, items } = resolvePlan(
      draft({ horizon: null, startDate: '2026-01-31', endDate: '2027-12-31', boundaryQuote: 'Jan 2026 - Dec 2027' }, [
        it_('Month 2', { unit: 'month', index: 2 }),
        it_('Year 2', { unit: 'year', index: 2 }),
        it_('Deadline', { unit: 'day', date: '2026-06-30' }),
      ]),
      opts(),
    );
    expect(plan.start).toBe('2026-01-31T00:00'); // the planner's own start date wins
    expect(plan.end).toBe('2028-01-01T00:00');
    const byText = Object.fromEntries(items.map((i) => [i.text, i]));
    expect(byText['Month 2']).toMatchObject({ start: '2026-02-28T00:00', end: '2026-03-31T00:00' });
    expect(byText['Year 2']).toMatchObject({ start: '2027-01-31T00:00', end: '2028-01-01T00:00' }); // clamped to plan end
    expect(byText['Deadline']).toMatchObject({ start: '2026-06-30T00:00', end: '2026-07-01T00:00' });
  });

  it('reports items it cannot place instead of guessing', () => {
    const { items, problems } = resolvePlan(
      draft({}, [
        it_('Week 14 task', { unit: 'week', index: 14 }),
        it_('Someday', { unit: 'week' }),
        it_('Bad time', { unit: 'day', index: 1, timeStart: '25:00' }),
        it_('Bad date', { unit: 'day', date: '2026-02-30' }),
      ]),
      opts(),
    );
    expect(items).toHaveLength(0);
    expect(problems.map((p) => p.quote)).toEqual(['Week 14 task', 'Someday', 'Bad time', 'Bad date']);
    expect(problems[0]!.reason).toContain("outside the plan's time limit");
  });
});
