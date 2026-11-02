import type { Unit, WallTime } from './types';

// Calendar arithmetic on civil dates (no Date objects, no timezone, no DST): a day is
// a day. Instants only appear in wallClock(), which turns "now" into the user's local
// wall-clock time via Intl, so DST and travel are handled by the platform's tz data.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDate(s: string | null | undefined): s is string {
  const m = s ? DATE_RE.exec(s) : null;
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

export function isValidTime(s: string | null | undefined): s is string {
  return !!s && TIME_RE.test(s);
}

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] as number;
}

/** Days since 1970-01-01 for a civil date (Howard Hinnant's algorithm). */
export function toDays(date: string): number {
  const [y0, m, d] = date.split('-').map(Number) as [number, number, number];
  const y = m <= 2 ? y0 - 1 : y0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromDays(z0: number): string {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export const addDays = (date: string, n: number): string => fromDays(toDays(date) + n);

/** Same day-of-month n months later, clamped (Jan 31 + 1 month → Feb 28/29). */
export function addMonths(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return `${String(ny).padStart(4, '0')}-${String(nm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
}

/** 1 = Monday … 7 = Sunday. 1970-01-01 was a Thursday. */
export function weekday(date: string): number {
  return ((((toDays(date) + 3) % 7) + 7) % 7) + 1;
}

export const wall = (date: string, time = '00:00'): WallTime => `${date}T${time}`;
export const wallDate = (w: WallTime): string => w.slice(0, 10);
export const wallTime = (w: WallTime): string => w.slice(11, 16);

/** Add whole minutes to a wall time (calendar arithmetic; DST is the platform's job at "now"). */
export function addMinutes(w: WallTime, minutes: number): WallTime {
  const total = toDays(wallDate(w)) * 1440 + toMinutes(wallTime(w)) + minutes;
  const days = Math.floor(total / 1440);
  const mins = total - days * 1440;
  return wall(fromDays(days), `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`);
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

/** Move a date by n units. Hours are handled by addMinutes. */
export function addUnits(date: string, unit: Exclude<Unit, 'hour'>, n: number): string {
  if (unit === 'day') return addDays(date, n);
  if (unit === 'week') return addDays(date, 7 * n);
  if (unit === 'month') return addMonths(date, n);
  return addMonths(date, 12 * n);
}

/** Minutes between two wall times (b - a). */
export function minutesBetween(a: WallTime, b: WallTime): number {
  return toDays(wallDate(b)) * 1440 + toMinutes(wallTime(b)) - (toDays(wallDate(a)) * 1440 + toMinutes(wallTime(a)));
}

/** The device's current IANA timezone ("Asia/Kolkata"), or UTC if the platform can't say. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * An instant as wall-clock time in a timezone (default: the device's current one).
 * This is the ONLY place real time enters: every comparison is wall time vs wall time.
 */
export function wallClock(instant: Date, timeZone: string = deviceTimeZone()): WallTime {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(instant);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  } catch {
    // No Intl timezone support: fall back to the runtime's local time.
    const p = (n: number) => String(n).padStart(2, '0');
    return `${instant.getFullYear()}-${p(instant.getMonth() + 1)}-${p(instant.getDate())}T${p(instant.getHours())}:${p(instant.getMinutes())}`;
  }
}
