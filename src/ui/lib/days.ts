import { AgendaDate } from '@/domain';

/** The next `count` dates starting today, as ISO strings. */
export function upcomingDates(count: number, now: Date = new Date()): string[] {
  const today = AgendaDate.fromDate(now);
  return Array.from({ length: count }, (_, i) => today.addDays(i).toISO());
}

export function todayISO(now: Date = new Date()): string {
  return AgendaDate.fromDate(now).toISO();
}
