import { describe, expect, it } from 'vitest';
import { parsePlanJson } from '../planJson';
import { resolvePlan } from '../resolve';
import { dayAgenda, missed, weekAgenda, yearAgenda } from '../view';

// Starts Monday 2026-11-02.
const json = JSON.stringify({
  title: 'T',
  duration: { weeks: 8 },
  tasks: [
    { task: 'flashcards', repeat: 'daily', time: '21:00', end_time: '21:15' },
    { task: 'read chapter', week: 1 },
    { task: 'gym', week: 1, weekday: 'wed', time: '18:00' },
    { task: 'essay', day: 2 },
    { task: 'month goal', month: 2 },
  ],
});
let n = 0;
const { items } = resolvePlan(parsePlanJson(json).spec!, {
  startDate: '2026-11-02', timezone: 'UTC', source: json, makeId: () => `i${++n}`, nowIso: '',
});
const texts = (list: { text: string }[]) => list.map((i) => i.text);

describe('dayAgenda', () => {
  it('splits a day into slots, single-day tasks and ongoing spans', () => {
    const tue = dayAgenda(items, '2026-11-03');
    expect(texts(tue.timed)).toEqual(['flashcards']);
    expect(texts(tue.tasks)).toEqual(['essay']);
    expect(texts(tue.ongoing)).toEqual(['read chapter']);
    expect(texts(dayAgenda(items, '2026-11-04').timed)).toEqual(['gym', 'flashcards']);
  });
});

describe('weekAgenda', () => {
  it('shows seven days from today and lists multi-day tasks once', () => {
    const w = weekAgenda(items, '2026-11-05');
    expect(w.days.map((d) => d.date)).toEqual([
      '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11',
    ]);
    expect(w.days.every((d) => d.ongoing.length === 0)).toBe(true);
    expect(texts(w.ongoing)).toEqual(['read chapter']);
  });
});

describe('yearAgenda', () => {
  it('groups a month by task, counting repeats, from the current month', () => {
    const months = yearAgenda(items, '2026-11-15');
    expect(months).toHaveLength(12);
    expect(months[0]?.month).toBe('2026-11');
    expect(months[11]?.month).toBe('2027-10');
    const nov = months[0]!;
    expect(nov.groups.find((g) => g.text === 'flashcards')?.count).toBe(29); // 2 Nov to 30 Nov
    // Plan month 2 starts 2 Dec and is trimmed to the plan's end (28 Dec): December only.
    expect(texts(nov.groups)).not.toContain('month goal');
    expect(texts(months[1]!.groups)).toContain('month goal');
    expect(months[2]?.total).toBe(0);
  });
});

describe('missed', () => {
  it('groups ended, unticked items so a missed habit is one line', () => {
    const done = items.map((it) => (it.text === 'essay' ? { ...it, doneAt: '2026-11-03T10:00:00Z' } : it));
    const m = missed(done, '2026-11-05T12:00');
    const cards = m.find((g) => g.text === 'flashcards');
    expect(cards?.count).toBe(3); // Mon, Tue, Wed evenings
    expect(texts(m)).not.toContain('essay');
    expect(texts(m)).not.toContain('read chapter'); // week 1 hasn't ended
  });
});
