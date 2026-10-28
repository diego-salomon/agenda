import { describe, it, expect, beforeEach } from 'vitest';
import { AgendaService } from '../AgendaService';
import { DomainError } from '@/domain';
import { brand } from '@/config/brand.config';
import { agenda } from '@/config/agenda.config';
import { MemoryRepo, fixedClock, sequentialCodes, RecordingGateway } from './support';

// Clock pinned to Tue 2026-10-20 09:00 local. 2026-10-28 is a Wednesday (open).
const CLOCK = '2026-10-20T09:00:00';
const WED = '2026-10-28';

function makeService(repo = new MemoryRepo(), codes = sequentialCodes('ABC234', 'XYZ567')) {
  const notifications = new RecordingGateway();
  const service = new AgendaService({
    repo,
    clock: fixedClock(CLOCK),
    codes,
    notifications,
    brand,
    agenda,
  });
  return { service, repo, notifications };
}

describe('AgendaService', () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => {
    ctx = makeService();
  });

  const bookReq = {
    serviceId: 'consulta-inicial',
    dateISO: WED,
    time: '09:00',
    name: 'Ada Lovelace',
    phone: '0981123456',
  };

  it('books a free slot and composes a confirmation', async () => {
    const result = await ctx.service.book(bookReq);
    expect(result.booking.code).toBe('ABC234');
    expect(result.booking.patient.phone).toBe('+595981123456');
    expect(result.notification.kind).toBe('confirmation');
    expect(result.notification.simulated).toBe(true);
    expect(result.notification.body).toContain('ABC234');
    expect(result.notification.body).toContain('Estudio Aurora');
    // recorded for the admin "simulado" panel
    expect(ctx.service.sentNotifications()).toHaveLength(1);
  });

  it('blocks a double-booking of the same slot', async () => {
    await ctx.service.book(bookReq);
    await expect(ctx.service.book({ ...bookReq, name: 'Grace Hopper' })).rejects.toThrow(DomainError);
  });

  it('rejects a slot outside business hours', async () => {
    await expect(ctx.service.book({ ...bookReq, time: '12:00' })).rejects.toThrow(/atención/);
  });

  it('rejects a slot in the past', async () => {
    await expect(
      ctx.service.book({ ...bookReq, dateISO: '2026-10-19', time: '09:00' }),
    ).rejects.toThrow(/pasó/);
  });

  it('validates patient name and phone', async () => {
    await expect(ctx.service.book({ ...bookReq, name: 'a' })).rejects.toThrow(DomainError);
    await expect(ctx.service.book({ ...bookReq, phone: '123' })).rejects.toThrow(DomainError);
  });

  it('looks up and cancels by code, freeing the slot', async () => {
    await ctx.service.book(bookReq);
    const found = await ctx.service.lookup('abc234'); // case-insensitive
    expect(found?.booking.code).toBe('ABC234');
    expect(found?.service?.id).toBe('consulta-inicial');

    const { notification } = await ctx.service.cancel('ABC234');
    expect(notification.kind).toBe('cancellation');

    const day = await ctx.service.daySlots(WED);
    expect(day.slots.find((s) => s.time === '09:00')?.status).toBe('free');
  });

  it('returns null when looking up an unknown code', async () => {
    expect(await ctx.service.lookup('NOPE22')).toBeNull();
  });

  it('reports slot statuses: booked, blocked, past and free', async () => {
    await ctx.service.book(bookReq); // 09:00 booked
    await ctx.service.adminBlock(WED, '10:00', 'almuerzo');
    const day = await ctx.service.daySlots(WED);
    const byTime = Object.fromEntries(day.slots.map((s) => [s.time, s.status]));
    expect(byTime['09:00']).toBe('booked');
    expect(byTime['10:00']).toBe('blocked');
    expect(byTime['11:00']).toBe('free');

    // On the clock's own day, earlier slots are in the past.
    const today = await ctx.service.daySlots('2026-10-20');
    expect(today.slots.find((s) => s.time === '08:00')?.status).toBe('past');
    expect(today.slots.find((s) => s.time === '10:00')?.status).toBe('free');
  });

  it('marks attended and keeps the slot occupied', async () => {
    await ctx.service.book(bookReq);
    await ctx.service.adminMarkAttended(WED, 'ABC234');
    const day = await ctx.service.getDay(WED);
    expect(day.bookings[0].status).toBe('attended');
  });

  it('moves a booking across days', async () => {
    await ctx.service.book(bookReq);
    await ctx.service.adminMove('ABC234', '2026-10-29', '11:00');
    const origin = await ctx.service.daySlots(WED);
    expect(origin.slots.find((s) => s.time === '09:00')?.status).toBe('free');
    const dest = await ctx.service.daySlots('2026-10-29');
    expect(dest.slots.find((s) => s.time === '11:00')?.status).toBe('booked');
  });

  it('builds a 7-day week starting on Monday', async () => {
    const week = await ctx.service.weekAgenda(WED);
    expect(week.startISO).toBe('2026-10-26'); // Monday
    expect(week.days).toHaveLength(7);
    expect(week.days[6].open).toBe(false); // Sunday closed
  });

  it('resets demo data', async () => {
    await ctx.service.book(bookReq);
    await ctx.service.resetDemo();
    expect(await ctx.service.lookup('ABC234')).toBeNull();
  });
});
