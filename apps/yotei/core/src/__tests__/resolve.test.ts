import { describe, expect, it } from 'vitest';
import { parsePlanJson } from '../planJson';
import { resolvePlan } from '../resolve';
import { EXAMPLE_PLAN } from '../prompt';

// 2026-11-02 is a Monday.
function resolve(json: string, startDate = '2026-11-02') {
  const parsed = parsePlanJson(json);
  if (!parsed.spec) throw new Error(JSON.stringify(parsed.errors));
  let n = 0;
  return resolvePlan(parsed.spec, { startDate, timezone: 'UTC', source: json, makeId: () => `id${++n}`, nowIso: '' });
}
const plan = (tasks: unknown[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ title: 'T', duration: { weeks: 4 }, tasks, ...extra });

describe('resolvePlan', () => {
  it('bounds the plan by its duration or its inclusive end date', () => {
    const a = resolve(plan([{ task: 'x', day: 1 }]));
    expect(a.plan).toMatchObject({ start: '2026-11-02T00:00', end: '2026-11-30T00:00', limit: '4 weeks', unit: 'week' });
    const b = resolve(JSON.stringify({ title: 'T', start: '2026-12-01', end: '2026-12-31', tasks: [{ task: 'x', day: 1 }] }));
    expect(b.plan).toMatchObject({ start: '2026-12-01T00:00', end: '2027-01-01T00:00', limit: 'until 2026-12-31' });
  });

  it('places relative tasks from the plan start, not the calendar week', () => {
    // A Wednesday start: plan week 2 is Wed 11 Nov to Tue 17 Nov.
    const { items } = resolve(
      plan([
        { task: 'week', week: 2 },
        { task: 'mon of week 2', week: 2, weekday: 'mon', time: '09:00', end_time: '10:30' },
        { task: 'day 3', day: 3 },
        { task: 'month 1', month: 1 },
      ]),
      '2026-11-04',
    );
    const at = (t: string) => items.find((i) => i.text === t)!;
    expect(at('week')).toMatchObject({ start: '2026-11-11T00:00', end: '2026-11-18T00:00', timed: false, timing: 'Week 2' });
    expect(at('mon of week 2')).toMatchObject({ start: '2026-11-16T09:00', end: '2026-11-16T10:30', timed: true, timing: 'Week 2 · Mon' });
    expect(at('day 3')).toMatchObject({ start: '2026-11-06T00:00', end: '2026-11-07T00:00' });
    expect(at('month 1')).toMatchObject({ start: '2026-11-04T00:00', end: '2026-12-02T00:00' }); // trimmed to the plan end
  });

  it('expands repeats inside their range and clips them to the plan', () => {
    const { items } = resolve(
      plan([
        { task: 'daily', repeat: 'daily', time: '21:00', end_time: '21:15' },
        { task: 'tue thu', week: [2, 3], repeat: ['tue', 'thu'] },
        { task: 'weekly', repeat: 'weekly' },
        { task: 'weekends', week: [4, 9], repeat: 'weekends' },
      ]),
    );
    const of = (t: string) => items.filter((i) => i.text === t);
    expect(of('daily')).toHaveLength(28);
    expect(of('daily')[0]).toMatchObject({ start: '2026-11-02T21:00', end: '2026-11-02T21:15', timing: 'Daily' });
    expect(of('tue thu').map((i) => i.start)).toEqual(['2026-11-10T00:00', '2026-11-12T00:00', '2026-11-17T00:00', '2026-11-19T00:00']);
    expect(of('tue thu')[0]?.timing).toBe('Weeks 2-3 · Tue, Thu');
    expect(of('weekly').map((i) => [i.start, i.end])).toEqual([
      ['2026-11-02T00:00', '2026-11-09T00:00'],
      ['2026-11-09T00:00', '2026-11-16T00:00'],
      ['2026-11-16T00:00', '2026-11-23T00:00'],
      ['2026-11-23T00:00', '2026-11-30T00:00'],
    ]);
    expect(of('weekends')).toHaveLength(2); // only week 4 is inside a 4-week plan
  });

  it('lists tasks outside the plan instead of moving them', () => {
    const { items, skipped } = resolve(plan([{ task: 'in', week: 4 }, { task: 'out', week: 5 }, { task: 'late', date: '2027-01-01' }]));
    expect(items.map((i) => i.text)).toEqual(['in']);
    expect(skipped.map((s) => s.path)).toEqual(['tasks[1]', 'tasks[2]']);
  });

  it('keeps a slot that crosses midnight exactly as written', () => {
    const { items } = resolve(plan([{ task: 'night', day: 1, time: '22:00', end_time: '01:00' }]));
    expect(items[0]).toMatchObject({ start: '2026-11-02T22:00', end: '2026-11-03T01:00' });
  });

  it('sorts items by start and gives each an id', () => {
    const { items } = resolve(EXAMPLE_PLAN);
    expect(items.every((it, i) => i === 0 || items[i - 1]!.start <= it.start)).toBe(true);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(items.map((i) => i.sort)).toEqual(items.map((_, i) => i));
  });

  it('refuses a plan that expands into too many items', () => {
    const tasks = Array.from({ length: 20 }, (_, i) => ({ task: `habit ${i}`, repeat: 'daily' }));
    expect(() => resolve(JSON.stringify({ title: 'T', duration: { years: 1 }, tasks }))).toThrow(/more than 5,000/);
  });
});
