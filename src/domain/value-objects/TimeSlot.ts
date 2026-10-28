import { DomainError } from '../errors';

const HHMM = /^(\d{2}):(\d{2})$/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The start time of a slot within a day, as minutes from 00:00. */
export class TimeSlot {
  private constructor(readonly minutes: number) {}

  static validate(hhmm: string): string | null {
    const match = HHMM.exec(hhmm);
    if (!match) return 'Hora inválida (formato HH:MM).';
    if (Number(match[1]) > 23) return 'Hora fuera de rango.';
    if (Number(match[2]) > 59) return 'Minutos fuera de rango.';
    return null;
  }

  static create(hhmm: string): TimeSlot {
    const error = TimeSlot.validate(hhmm);
    if (error) throw new DomainError(error);
    const match = HHMM.exec(hhmm)!;
    return new TimeSlot(Number(match[1]) * 60 + Number(match[2]));
  }

  static fromMinutes(minutes: number): TimeSlot {
    if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 24 * 60) {
      throw new DomainError('Minutos fuera de rango.');
    }
    return new TimeSlot(minutes);
  }

  toHHMM(): string {
    return `${pad(Math.floor(this.minutes / 60))}:${pad(this.minutes % 60)}`;
  }

  plusMinutes(n: number): TimeSlot {
    return TimeSlot.fromMinutes(this.minutes + n);
  }

  equals(other: TimeSlot): boolean {
    return this.minutes === other.minutes;
  }

  isBefore(other: TimeSlot): boolean {
    return this.minutes < other.minutes;
  }

  compare(other: TimeSlot): number {
    return this.minutes - other.minutes;
  }
}
