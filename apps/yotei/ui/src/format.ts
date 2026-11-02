import { addDays, wallDate, wallTime, weekday, type PlanItem, type WallTime } from '@yotei/core';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Wed 4 Nov" (year added when it isn't the current one). */
export function dayLabel(date: string, currentYear?: string): string {
  const [y, m, d] = date.split('-');
  const base = `${DOW[weekday(date) - 1]} ${Number(d)} ${MON[Number(m) - 1]}`;
  return currentYear && y !== currentYear ? `${base} ${y}` : base;
}

/** "Monday" */
export const weekdayLong = (date: string): string => DOW_LONG[weekday(date) - 1] as string;

/** "2 November 2026" */
export function longDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${Number(d)} ${MON_LONG[Number(m) - 1]} ${y}`;
}

/** "November 2026" from "2026-11". */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${MON_LONG[Number(m) - 1]} ${y}`;
}

/** "Today", "Tomorrow", or "Wed 4 Nov". */
export function relativeDay(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  if (date === addDays(today, -1)) return 'Yesterday';
  return dayLabel(date, today.slice(0, 4));
}

/** The last calendar day inside an exclusive end. */
export const lastDay = (end: WallTime): string => (end.endsWith('T00:00') ? addDays(wallDate(end), -1) : wallDate(end));

/** "07:00-07:45" */
export const timeRange = (item: Pick<PlanItem, 'start' | 'end'>): string => `${wallTime(item.start)}-${wallTime(item.end)}`;

/** When an item happens, in the user's local time: "Mon 16 Nov 09:00-11:00", "Wed 4 Nov - Tue 10 Nov". */
export function whenLabel(item: Pick<PlanItem, 'start' | 'end' | 'timed'>, now: WallTime): string {
  const year = now.slice(0, 4);
  const startDay = wallDate(item.start);
  if (item.timed) {
    const endDay = wallDate(item.end);
    const endPart = endDay === startDay ? wallTime(item.end) : `${dayLabel(endDay, year)} ${wallTime(item.end)}`;
    return `${dayLabel(startDay, year)} ${wallTime(item.start)}-${endPart}`;
  }
  const last = lastDay(item.end);
  return last === startDay ? dayLabel(startDay, year) : `${dayLabel(startDay, year)} - ${dayLabel(last, year)}`;
}

/** "3d 4h", "45m": time left until a wall time. */
export function untilLabel(minutes: number): string {
  if (minutes < 60) return `${Math.max(0, minutes)}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
}
