import { DomainError } from '../errors';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/**
 * A calendar date with no time and no timezone. Stored as year/month/day
 * integers so it never drifts across DST or UTC boundaries — every Date it
 * builds internally is pinned to local noon.
 */
export class AgendaDate {
  private constructor(
    readonly year: number,
    readonly month: number, // 1-12
    readonly day: number, // 1-31
  ) {}

  static validate(iso: string): string | null {
    const match = ISO.exec(iso);
    if (!match) return 'Fecha inválida (formato AAAA-MM-DD).';
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    if (m < 1 || m > 12) return 'Mes fuera de rango.';
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < 1 || d > daysInMonth) return 'Día fuera de rango.';
    return null;
  }

  static create(iso: string): AgendaDate {
    const error = AgendaDate.validate(iso);
    if (error) throw new DomainError(error);
    const match = ISO.exec(iso)!;
    return new AgendaDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  static fromDate(date: Date): AgendaDate {
    return new AgendaDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  static today(now: Date = new Date()): AgendaDate {
    return AgendaDate.fromDate(now);
  }

  private asDate(): Date {
    return new Date(this.year, this.month - 1, this.day, 12, 0, 0, 0);
  }

  toISO(): string {
    return `${pad(this.year, 4)}-${pad(this.month)}-${pad(this.day)}`;
  }

  /** 0 = Sunday ... 6 = Saturday. */
  weekday(): number {
    return this.asDate().getDay();
  }

  addDays(n: number): AgendaDate {
    const d = this.asDate();
    d.setDate(d.getDate() + n);
    return AgendaDate.fromDate(d);
  }

  /** Monday-based start of the week this date falls in. */
  startOfWeek(): AgendaDate {
    const daysSinceMonday = (this.weekday() + 6) % 7;
    return this.addDays(-daysSinceMonday);
  }

  compare(other: AgendaDate): number {
    return this.toISO().localeCompare(other.toISO());
  }

  equals(other: AgendaDate): boolean {
    return this.compare(other) === 0;
  }

  isBefore(other: AgendaDate): boolean {
    return this.compare(other) < 0;
  }

  isAfter(other: AgendaDate): boolean {
    return this.compare(other) > 0;
  }
}
