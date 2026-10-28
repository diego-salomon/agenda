import { describe, it, expect } from 'vitest';
import { DayAggregate } from '../entities/DayAggregate';
import { AgendaDate } from '../value-objects/AgendaDate';
import { TimeSlot } from '../value-objects/TimeSlot';
import { DomainError } from '../errors';

const date = AgendaDate.create('2026-10-28'); // Wednesday

function book(agg: DayAggregate, time: string, code = 'ABC234') {
  return agg.book({
    code,
    time,
    serviceId: 'svc',
    patient: { name: 'Ada', phone: '+595981123456' },
    createdAt: '2026-10-20T10:00:00.000Z',
  });
}

describe('DayAggregate', () => {
  it('books a free slot', () => {
    const agg = book(DayAggregate.create(date), '09:00');
    expect(agg.bookings).toHaveLength(1);
    expect(agg.isSlotFree(TimeSlot.create('09:00'))).toBe(false);
  });

  it('blocks a double-booking on the same active slot', () => {
    const agg = book(DayAggregate.create(date), '09:00', 'ABC234');
    expect(() => book(agg, '09:00', 'XYZ567')).toThrow(DomainError);
    try {
      book(agg, '09:00', 'XYZ567');
    } catch (e) {
      expect((e as DomainError).code).toBe('SLOT_TAKEN');
    }
  });

  it('frees the slot again after cancelling', () => {
    let agg = book(DayAggregate.create(date), '09:00');
    agg = agg.cancel('ABC234', '2026-10-21T10:00:00.000Z');
    expect(agg.isSlotFree(TimeSlot.create('09:00'))).toBe(true);
    // the cancelled booking is kept, never deleted
    expect(agg.bookings).toHaveLength(1);
    expect(agg.bookings[0].status).toBe('cancelled');
    expect(agg.bookings[0].cancelledAt).toBeDefined();
    // and the slot can be booked again
    agg = book(agg, '09:00', 'NEW234');
    expect(agg.activeBookingAt(TimeSlot.create('09:00'))?.code).toBe('NEW234');
  });

  it('keeps an attended booking occupying its slot', () => {
    let agg = book(DayAggregate.create(date), '09:00');
    agg = agg.markAttended('ABC234');
    expect(agg.isSlotFree(TimeSlot.create('09:00'))).toBe(false);
  });

  it('removes availability with a block and restores it when freed', () => {
    let agg = DayAggregate.create(date).block('10:00', 'almuerzo', '2026-10-20T10:00:00.000Z');
    expect(agg.isSlotFree(TimeSlot.create('10:00'))).toBe(false);
    expect(() => book(agg, '10:00')).toThrow(/bloqueado/);
    agg = agg.free('10:00');
    expect(agg.isSlotFree(TimeSlot.create('10:00'))).toBe(true);
  });

  it('refuses to block a slot with an active booking', () => {
    const agg = book(DayAggregate.create(date), '09:00');
    expect(() => agg.block('09:00', undefined, '2026-10-20T10:00:00.000Z')).toThrow(DomainError);
  });

  it('moves a booking to a free slot within the day', () => {
    let agg = book(DayAggregate.create(date), '09:00');
    agg = agg.moveWithinDay('ABC234', '10:00');
    expect(agg.isSlotFree(TimeSlot.create('09:00'))).toBe(true);
    expect(agg.activeBookingAt(TimeSlot.create('10:00'))?.code).toBe('ABC234');
  });

  it('refuses to move onto an occupied slot', () => {
    let agg = book(DayAggregate.create(date), '09:00', 'ABC234');
    agg = book(agg, '10:00', 'XYZ567');
    expect(() => agg.moveWithinDay('ABC234', '10:00')).toThrow(DomainError);
  });

  it('rejects construction that violates the one-active-booking invariant', () => {
    const base = {
      serviceId: 'svc',
      patient: { name: 'Ada', phone: '+595981123456' },
      createdAt: '2026-10-20T10:00:00.000Z',
      date: '2026-10-28',
      status: 'confirmed' as const,
    };
    expect(() =>
      DayAggregate.create(date, [
        { ...base, code: 'AAA234', time: '09:00' },
        { ...base, code: 'BBB234', time: '09:00' },
      ]),
    ).toThrow(DomainError);
  });
});
