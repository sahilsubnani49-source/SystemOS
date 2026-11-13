import { describe, expect, it } from 'vitest';
import { extractJson, parsePlanJson } from '../planJson';
import { EXAMPLE_PLAN, PLAN_PROMPT } from '../prompt';

const plan = (tasks: unknown[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ yotei: 1, title: 'Test', duration: { weeks: 4 }, tasks, ...extra });

describe('parsePlanJson', () => {
  it('accepts the example in the copy snippet, with every task', () => {
    const r = parsePlanJson(EXAMPLE_PLAN);
    expect(r.errors).toEqual([]);
    expect(r.skipped).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.spec?.tasks).toHaveLength(6);
    expect(PLAN_PROMPT).toContain(EXAMPLE_PLAN);
  });

  it('reads a whole LLM reply: prose and a ```json fence around the object', () => {
    const reply = `Sure! Here is your plan:\n\n\`\`\`json\n${plan([{ task: 'Run', day: 1 }])}\n\`\`\`\nGood luck!`;
    expect(extractJson(reply).startsWith('{')).toBe(true);
    expect(parsePlanJson(reply).spec?.tasks[0]?.task).toBe('Run');
  });

  it('requires exactly one time limit, never inventing one', () => {
    const none = parsePlanJson(JSON.stringify({ title: 'X', tasks: [{ task: 'a', day: 1 }] }));
    expect(none.spec).toBeNull();
    expect(none.errors[0]?.path).toBe('duration');
    const both = parsePlanJson(plan([{ task: 'a', day: 1 }], { end: '2026-12-01' }));
    expect(both.errors[0]?.message).toMatch(/not both/);
    expect(parsePlanJson(plan([{ task: 'a', day: 1 }], { duration: { fortnights: 2 } })).spec).toBeNull();
    expect(parsePlanJson(JSON.stringify({ title: 'X', end: '2026-12-01', tasks: [{ task: 'a', day: 1 }] })).spec?.end).toBe(
      '2026-12-01',
    );
  });

  it('reports invalid JSON and plan-level problems with a path', () => {
    expect(parsePlanJson('{ "title": ').errors[0]?.message).toMatch(/Not valid JSON/);
    expect(parsePlanJson(plan([], { title: '' })).errors.map((e) => e.path)).toEqual(['title', 'tasks']);
    expect(parsePlanJson(plan([{ task: 'a', day: 1 }], { yotei: 2 })).errors[0]?.path).toBe('yotei');
    expect(parsePlanJson(plan([{ task: 'a', day: 1 }], { start: '2026-02-30' })).errors[0]?.path).toBe('start');
  });

  it('skips a broken task with the reason and keeps the rest', () => {
    const r = parsePlanJson(
      plan([
        { task: 'ok', week: 1 },
        { task: 'no timing' },
        { task: 'two ranges', week: 1, day: 2 },
        { task: 'bad weekday', week: 1, weekday: 'funday' },
        { task: 'weekday on a range', week: [1, 2], weekday: 'mon' },
        { task: 'time on a week', week: 2, time: '09:00' },
        { task: 'end_time alone', day: 1, end_time: '09:00' },
        { task: 'bad repeat', repeat: 'hourly' },
        { task: 'bad range', week: [3, 1] },
      ]),
    );
    expect(r.spec?.tasks.map((t) => t.task)).toEqual(['ok']);
    expect(r.skipped.map((s) => s.path)).toEqual(['tasks[1]', 'tasks[2]', 'tasks[3]', 'tasks[4]', 'tasks[5]', 'tasks[6]', 'tasks[7]', 'tasks[8]']);
    expect(r.skipped[0]?.message).toMatch(/no timing/);
    expect(r.skipped[3]?.message).toMatch(/"repeat": \["mon"\]/);
  });

  it('allows a clock time wherever the task lands on single days', () => {
    const r = parsePlanJson(
      plan([
        { task: 'a', day: 3, time: '06:30' },
        { task: 'b', week: 2, weekday: 'Wednesday', time: '18:00', end_time: '19:00' },
        { task: 'c', repeat: 'weekdays', time: '07:00' },
        { task: 'd', date: '2026-11-20', time: '10:00' },
      ]),
    );
    expect(r.skipped).toEqual([]);
    expect(r.spec?.tasks[1]?.range).toEqual({ kind: 'index', unit: 'week', from: 2, to: 2, weekday: 3 });
  });

  it('normalizes repeat day lists and warns once per unknown field', () => {
    const r = parsePlanJson(
      plan([
        { task: 'a', repeat: ['Thu', 'mon', 'thu'], description: 'x' },
        { task: 'b', day: 1, description: 'y' },
      ], { author: 'gpt' }),
    );
    expect(r.spec?.tasks[0]?.repeat).toEqual(['mon', 'thu']);
    expect(r.warnings).toEqual([
      { path: 'author', message: 'Unknown field, ignored' },
      { path: 'tasks[].description', message: 'Unknown field, ignored (in 2 places)' },
    ]);
  });
});
