// Date helpers for the goal timeline. Quests are scheduled by calendar day, stored
// as local `YYYY-MM-DD` strings so "today's quests" is a simple string comparison.

/** Local calendar date as YYYY-MM-DD (not UTC — the player's day, not the server's). */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's local date as YYYY-MM-DD. */
export function todayDateStr(): string {
  return toDateStr(new Date());
}

/** Add `days` calendar days to a YYYY-MM-DD string, returning a YYYY-MM-DD string. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}

/** Whole-day difference (b - a). Both YYYY-MM-DD. Positive when b is after a. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const aMs = new Date(ay, am - 1, ad).getTime();
  const bMs = new Date(by, bm - 1, bd).getTime();
  return Math.round((bMs - aMs) / 86_400_000);
}
