/**
 * A staff-held slot that removes availability without being a patient booking
 * (lunch, a walk-in, a day off). Kept separate from bookings so the
 * one-active-booking-per-slot invariant only ever reasons about patients.
 */
export interface Block {
  date: string; // ISO YYYY-MM-DD
  time: string; // HH:MM, slot start
  reason?: string;
  createdAt: string; // ISO timestamp
}
