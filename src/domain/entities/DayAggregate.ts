import { DomainError } from '../errors';
import { occupiesSlot } from '../types';
import { AgendaDate } from '../value-objects/AgendaDate';
import { TimeSlot } from '../value-objects/TimeSlot';
import type { BusinessHours } from './BusinessHours';
import type { Booking, Patient } from './Booking';
import type { Block } from './Block';

export interface BookInput {
  code: string;
  time: string;
  serviceId: string;
  patient: Patient;
  createdAt: string;
}

/**
 * The whole day is the unit that gets loaded and saved, so the
 * one-active-booking-per-slot invariant is always checked against the complete
 * picture — there is never a window where two writers each think a slot is free.
 *
 * Instances are immutable: every mutation returns a new aggregate, which keeps
 * the invariant easy to reason about and the entity trivial to unit-test.
 */
export class DayAggregate {
  private constructor(
    readonly date: AgendaDate,
    private readonly _bookings: readonly Booking[],
    private readonly _blocks: readonly Block[],
  ) {}

  static create(date: AgendaDate, bookings: Booking[] = [], blocks: Block[] = []): DayAggregate {
    const aggregate = new DayAggregate(date, [...bookings], [...blocks]);
    aggregate.assertInvariant();
    return aggregate;
  }

  get bookings(): readonly Booking[] {
    return this._bookings;
  }

  get blocks(): readonly Block[] {
    return this._blocks;
  }

  private assertInvariant(): void {
    const seen = new Set<string>();
    for (const booking of this._bookings) {
      if (!occupiesSlot(booking.status)) continue;
      if (seen.has(booking.time)) {
        throw new DomainError(`Doble reserva activa en ${booking.time}.`, 'INVARIANT_VIOLATION');
      }
      seen.add(booking.time);
    }
  }

  activeBookingAt(time: TimeSlot): Booking | null {
    const hhmm = time.toHHMM();
    return this._bookings.find((b) => b.time === hhmm && occupiesSlot(b.status)) ?? null;
  }

  blockAt(time: TimeSlot): Block | null {
    const hhmm = time.toHHMM();
    return this._blocks.find((b) => b.time === hhmm) ?? null;
  }

  isSlotFree(time: TimeSlot): boolean {
    return !this.activeBookingAt(time) && !this.blockAt(time);
  }

  findByCode(code: string): Booking | null {
    return this._bookings.find((b) => b.code === code) ?? null;
  }

  availableSlots(hours: BusinessHours): TimeSlot[] {
    return hours.slotsFor(this.date).filter((slot) => this.isSlotFree(slot));
  }

  book(input: BookInput): DayAggregate {
    const time = TimeSlot.create(input.time);
    if (this.blockAt(time)) {
      throw new DomainError('Ese horario está bloqueado.', 'SLOT_BLOCKED');
    }
    if (this.activeBookingAt(time)) {
      throw new DomainError('Ese horario ya no está disponible.', 'SLOT_TAKEN');
    }
    const booking: Booking = {
      code: input.code,
      date: this.date.toISO(),
      time: input.time,
      serviceId: input.serviceId,
      patient: input.patient,
      status: 'confirmed',
      createdAt: input.createdAt,
    };
    return new DayAggregate(this.date, [...this._bookings, booking], this._blocks);
  }

  cancel(code: string, cancelledAt: string): DayAggregate {
    const target = this._bookings.find((b) => b.code === code && occupiesSlot(b.status));
    if (!target) {
      throw new DomainError('No hay una reserva activa con ese código.', 'BOOKING_NOT_FOUND');
    }
    const bookings = this._bookings.map((b) =>
      b.code === code && occupiesSlot(b.status)
        ? { ...b, status: 'cancelled' as const, cancelledAt }
        : b,
    );
    return new DayAggregate(this.date, bookings, this._blocks);
  }

  markAttended(code: string): DayAggregate {
    const target = this._bookings.find((b) => b.code === code && b.status === 'confirmed');
    if (!target) {
      throw new DomainError('No hay una reserva confirmada con ese código.', 'BOOKING_NOT_FOUND');
    }
    const bookings = this._bookings.map((b) =>
      b.code === code ? { ...b, status: 'attended' as const } : b,
    );
    return new DayAggregate(this.date, bookings, this._blocks);
  }

  /** Move a booking to another slot within the same day. */
  moveWithinDay(code: string, toTime: string): DayAggregate {
    const target = this._bookings.find((b) => b.code === code && occupiesSlot(b.status));
    if (!target) {
      throw new DomainError('No hay una reserva activa con ese código.', 'BOOKING_NOT_FOUND');
    }
    const destination = TimeSlot.create(toTime);
    if (destination.toHHMM() === target.time) return this;
    if (this.blockAt(destination)) {
      throw new DomainError('El horario de destino está bloqueado.', 'SLOT_BLOCKED');
    }
    if (this.activeBookingAt(destination)) {
      throw new DomainError('El horario de destino ya está ocupado.', 'SLOT_TAKEN');
    }
    const bookings = this._bookings.map((b) =>
      b.code === code ? { ...b, time: destination.toHHMM() } : b,
    );
    return new DayAggregate(this.date, bookings, this._blocks);
  }

  block(time: string, reason: string | undefined, createdAt: string): DayAggregate {
    const slot = TimeSlot.create(time);
    if (this.activeBookingAt(slot)) {
      throw new DomainError('No puedes bloquear un horario con una reserva activa.', 'SLOT_TAKEN');
    }
    if (this.blockAt(slot)) return this; // idempotent
    const block: Block = { date: this.date.toISO(), time: slot.toHHMM(), reason, createdAt };
    return new DayAggregate(this.date, this._bookings, [...this._blocks, block]);
  }

  free(time: string): DayAggregate {
    const slot = TimeSlot.create(time);
    const blocks = this._blocks.filter((b) => b.time !== slot.toHHMM());
    if (blocks.length === this._blocks.length) return this;
    return new DayAggregate(this.date, this._bookings, blocks);
  }
}
