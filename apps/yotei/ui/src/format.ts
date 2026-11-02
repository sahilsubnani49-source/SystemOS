import { addDays, wallDate, wallTime, weekday, type PlanItem, type WallTime } from '@yotei/core';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Wed 4 Nov" (year added when it isn't the current one). */
export function dayLabel(date: string, currentYear?: string): string {
  const [y, m, d] = date.split('-');
  const base = `${DOW[weekday(date) - 1]} ${Number(d)} ${MON[Number(m) - 1]}`;
  return currentYear && y !== currentYear ? `${base} ${y}` : base;
}

/** The last calendar day inside an exclusive end. */
export const lastDay = (end: WallTime): string => (end.endsWith('T00:00') ? addDays(wallDate(end), -1) : wallDate(end));

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
