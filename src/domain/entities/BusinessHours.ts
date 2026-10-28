import { AgendaDate } from '../value-objects/AgendaDate';
import { TimeSlot } from '../value-objects/TimeSlot';

/** An opening window within a weekday, e.g. { from: "08:00", to: "12:00" }. */
export interface Tramo {
  from: string;
  to: string;
}

/** Weekday (0 = Sunday ... 6 = Saturday) to its opening windows. */
export type WeeklyHours = Record<number, Tramo[]>;

/**
 * The weekly schedule plus a uniform slot grid. A day can have several tramos
 * (e.g. a morning and an afternoon split by a lunch break); the grid is laid
 * out independently inside each tramo.
 */
export class BusinessHours {
  constructor(
    readonly weekly: WeeklyHours,
    readonly slotMinutes: number = 60,
  ) {}

  tramosFor(weekday: number): Tramo[] {
    return this.weekly[weekday] ?? [];
  }

  isOpenOn(date: AgendaDate): boolean {
    return this.tramosFor(date.weekday()).length > 0;
  }

  /** Every slot start time available on this date, honoring the grid and tramos. */
  slotsFor(date: AgendaDate): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (const tramo of this.tramosFor(date.weekday())) {
      const from = TimeSlot.create(tramo.from).minutes;
      const to = TimeSlot.create(tramo.to).minutes;
      for (let m = from; m + this.slotMinutes <= to; m += this.slotMinutes) {
        slots.push(TimeSlot.fromMinutes(m));
      }
    }
    return slots.sort((a, b) => a.compare(b));
  }

  containsSlot(date: AgendaDate, slot: TimeSlot): boolean {
    return this.slotsFor(date).some((s) => s.equals(slot));
  }
}
