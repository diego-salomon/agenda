import { AgendaDate, DayAggregate, type Block, type Booking } from '@/domain';
import type { AgendaRepository } from '../ports/AgendaRepository';
import type { Clock } from '../ports/Clock';
import type { CodeGenerator } from '../ports/CodeGenerator';
import type { NotificationGateway, NotificationMessage } from '../ports/NotificationGateway';

/** In-memory repository used by the application-layer tests. */
export class MemoryRepo implements AgendaRepository {
  private days = new Map<string, { bookings: Booking[]; blocks: Block[] }>();

  async loadDay(date: AgendaDate): Promise<DayAggregate> {
    const entry = this.days.get(date.toISO()) ?? { bookings: [], blocks: [] };
    return DayAggregate.create(date, entry.bookings, entry.blocks);
  }

  async save(day: DayAggregate): Promise<void> {
    this.days.set(day.date.toISO(), {
      bookings: [...day.bookings],
      blocks: [...day.blocks],
    });
  }

  async findByCode(code: string): Promise<Booking | null> {
    for (const entry of this.days.values()) {
      const found = entry.bookings.find((b) => b.code === code);
      if (found) return found;
    }
    return null;
  }

  async bookingsBetween(from: AgendaDate, to: AgendaDate): Promise<readonly Booking[]> {
    const out: Booking[] = [];
    for (const entry of this.days.values()) {
      for (const b of entry.bookings) {
        const d = AgendaDate.create(b.date);
        if (!d.isBefore(from) && !d.isAfter(to)) out.push(b);
      }
    }
    return out;
  }

  async blocksBetween(from: AgendaDate, to: AgendaDate): Promise<readonly Block[]> {
    const out: Block[] = [];
    for (const entry of this.days.values()) {
      for (const bl of entry.blocks) {
        const d = AgendaDate.create(bl.date);
        if (!d.isBefore(from) && !d.isAfter(to)) out.push(bl);
      }
    }
    return out;
  }

  async resetDemo(): Promise<void> {
    this.days.clear();
  }
}

export function fixedClock(iso: string): Clock {
  return { now: () => new Date(iso) };
}

export function sequentialCodes(...codes: string[]): CodeGenerator {
  let i = 0;
  return { next: () => codes[i++] ?? `Z${i}2345` };
}

export class RecordingGateway implements NotificationGateway {
  private messages: NotificationMessage[] = [];
  async send(message: NotificationMessage): Promise<void> {
    this.messages.unshift(message);
  }
  recorded(): readonly NotificationMessage[] {
    return this.messages;
  }
}
