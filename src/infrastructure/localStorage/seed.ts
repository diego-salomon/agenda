import { AgendaDate, BusinessHours, BookingCode, type Block, type Booking } from '@/domain';
import { agenda } from '@/config/agenda.config';

export interface DemoStore {
  bookings: Booking[];
  blocks: Block[];
}

/** Generic demo patients — fictional, no real people. */
const PATIENTS: Array<[string, string]> = [
  ['María González', '+595981100200'],
  ['Carlos Benítez', '+595981100201'],
  ['Lucía Ramírez', '+595981100202'],
  ['Diego Fernández', '+595981100203'],
  ['Sofía Martínez', '+595981100204'],
  ['Javier Rojas', '+595981100205'],
];

/**
 * Build a believable demo agenda relative to "now" so the portfolio always
 * looks current: a handful of bookings across the next open days, plus one
 * staff block. Plenty of slots stay free so a visitor can book.
 */
export function demoSeed(now: Date): DemoStore {
  const hours = new BusinessHours(agenda.hours, agenda.slotMinutes);
  const services = agenda.services;
  const today = AgendaDate.fromDate(now);
  const bookings: Booking[] = [];
  const blocks: Block[] = [];
  const createdAt = now.toISOString();

  let patientIdx = 0;
  let openDays = 0;

  for (let offset = 1; offset <= 12 && openDays < 4; offset += 1) {
    const date = today.addDays(offset);
    const slots = hours.slotsFor(date);
    if (slots.length === 0) continue;
    openDays += 1;

    // Book the 1st and 3rd grid slots of the day (when they exist).
    for (const slotIndex of [0, 2]) {
      const slot = slots[slotIndex];
      if (!slot) continue;
      const [name, phone] = PATIENTS[patientIdx % PATIENTS.length];
      patientIdx += 1;
      bookings.push({
        code: BookingCode.generate().value,
        date: date.toISO(),
        time: slot.toHHMM(),
        serviceId: services[patientIdx % services.length].id,
        patient: { name, phone },
        status: 'confirmed',
        createdAt,
      });
    }

    // One afternoon block on the first open day.
    if (openDays === 1) {
      const afternoon = slots[slots.length - 1];
      if (afternoon) {
        blocks.push({
          date: date.toISO(),
          time: afternoon.toHHMM(),
          reason: 'Reservado por el equipo',
          createdAt,
        });
      }
    }
  }

  return { bookings, blocks };
}
