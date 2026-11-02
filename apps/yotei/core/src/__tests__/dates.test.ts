import { describe, expect, it } from 'vitest';
import { addDays, addMinutes, addMonths, fromDays, isValidDate, toDays, wallClock, weekday } from '../dates';

describe('civil dates', () => {
  it('round-trips days across leap years and centuries', () => {
    for (const d of ['1970-01-01', '2000-02-29', '2024-02-29', '2100-03-01', '1999-12-31', '2026-11-02']) {
      expect(fromDays(toDays(d))).toBe(d);
    }
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('clamps month arithmetic to the end of the month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-11-15', 14)).toBe('2028-01-15');
  });

  it('knows weekdays (1 = Monday)', () => {
    expect(weekday('2026-11-02')).toBe(1); // a Monday
    expect(weekday('2026-11-08')).toBe(7);
  });

  it('validates dates strictly', () => {
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2026-13-01')).toBe(false);
  });

  it('adds minutes across midnight', () => {
    expect(addMinutes('2026-11-02T23:30', 45)).toBe('2026-11-03T00:15');
  });
});

describe('wallClock: real time in the user\'s timezone', () => {
  const instant = new Date('2026-11-02T20:30:00Z');
  it('converts one instant into each zone\'s local wall time', () => {
    expect(wallClock(instant, 'UTC')).toBe('2026-11-02T20:30');
    expect(wallClock(instant, 'Asia/Kolkata')).toBe('2026-11-03T02:00'); // +05:30, next day
    expect(wallClock(instant, 'America/New_York')).toBe('2026-11-02T15:30'); // EST (-5) after DST ended
    expect(wallClock(instant, 'Asia/Tokyo')).toBe('2026-11-03T05:30');
  });
  it('follows DST changes from the platform\'s tz data', () => {
    // New York is on EDT (-4) in October.
    expect(wallClock(new Date('2026-10-15T12:00:00Z'), 'America/New_York')).toBe('2026-10-15T08:00');
  });
});
