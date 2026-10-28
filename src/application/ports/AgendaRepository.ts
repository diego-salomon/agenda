import type { AgendaDate, DayAggregate, Booking, Block } from '@/domain';

/**
 * The backend seam. Everything above this interface is backend-agnostic; the
 * only things that change between demo and live are the implementations of
 * these methods.
 *
 * NOTE ON ASYNC: the spec sketches these as synchronous, but a real network
 * backend (Supabase) cannot be wrapped synchronously. Returning Promises makes
 * the Supabase adapter a genuine drop-in; the localStorage adapter simply
 * resolves immediately. The whole-day load/save keeps the
 * one-active-booking-per-slot invariant defensible at the boundary.
 */
export interface AgendaRepository {
  /** Load the full day so the invariant is always checked against everything. */
  loadDay(date: AgendaDate): Promise<DayAggregate>;
  /** Persist the whole day atomically. */
  save(day: DayAggregate): Promise<void>;
  /** Find a booking by its human code, across any day. */
  findByCode(code: string): Promise<Booking | null>;
  /** All bookings whose date is in [from, to], inclusive. */
  bookingsBetween(from: AgendaDate, to: AgendaDate): Promise<readonly Booking[]>;
  /** All blocks whose date is in [from, to], inclusive. */
  blocksBetween(from: AgendaDate, to: AgendaDate): Promise<readonly Block[]>;
  /** Wipe and re-seed demo data. No-op in live mode. */
  resetDemo(): Promise<void>;
}
