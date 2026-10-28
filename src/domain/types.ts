/** JS weekday convention: 0 = Sunday, 1 = Monday, ... 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A patient booking never gets deleted — cancelling flips the status so the
 * audit trail survives. "blocked" is modelled separately as a `Block`, since a
 * staff hold is not a patient booking (see DOMAIN notes in the README).
 */
export type BookingStatus = 'confirmed' | 'cancelled' | 'attended';

/** A booking still occupies its slot while it is confirmed or already attended. */
export function occupiesSlot(status: BookingStatus): boolean {
  return status === 'confirmed' || status === 'attended';
}
