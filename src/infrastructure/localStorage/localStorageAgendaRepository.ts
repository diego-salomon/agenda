import { AgendaDate, DayAggregate, type Block, type Booking } from '@/domain';
import type { AgendaRepository } from '@/application';
import type { Clock } from '@/application';
import { demoSeed, type DemoStore } from './seed';

const KEY = 'agenda.demo.v1';

/**
 * Demo adapter. The whole agenda lives under one localStorage key; the day is
 * still the load/save unit so the application layer behaves identically to the
 * live backend. Storage is injected so it can be unit-tested without a browser.
 */
export class LocalStorageAgendaRepository implements AgendaRepository {
  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
    private readonly clock: Clock,
    private readonly key: string = KEY,
  ) {}

  private read(): DemoStore {
    const raw = this.storage.getItem(this.key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DemoStore;
        if (parsed && Array.isArray(parsed.bookings) && Array.isArray(parsed.blocks)) {
          return parsed;
        }
      } catch {
        // fall through to a fresh seed
      }
    }
    const seeded = demoSeed(this.clock.now());
    this.write(seeded);
    return seeded;
  }

  private write(store: DemoStore): void {
    this.storage.setItem(this.key, JSON.stringify(store));
  }

  async loadDay(date: AgendaDate): Promise<DayAggregate> {
    const store = this.read();
    const iso = date.toISO();
    return DayAggregate.create(
      date,
      store.bookings.filter((b) => b.date === iso),
      store.blocks.filter((b) => b.date === iso),
    );
  }

  async save(day: DayAggregate): Promise<void> {
    const store = this.read();
    const iso = day.date.toISO();
    const bookings = store.bookings.filter((b) => b.date !== iso).concat([...day.bookings]);
    const blocks = store.blocks.filter((b) => b.date !== iso).concat([...day.blocks]);
    this.write({ bookings, blocks });
  }

  async findByCode(code: string): Promise<Booking | null> {
    return this.read().bookings.find((b) => b.code === code) ?? null;
  }

  async bookingsBetween(from: AgendaDate, to: AgendaDate): Promise<readonly Booking[]> {
    return this.read().bookings.filter((b) => inRange(b.date, from, to));
  }

  async blocksBetween(from: AgendaDate, to: AgendaDate): Promise<readonly Block[]> {
    return this.read().blocks.filter((b) => inRange(b.date, from, to));
  }

  async resetDemo(): Promise<void> {
    this.write(demoSeed(this.clock.now()));
  }
}

function inRange(iso: string, from: AgendaDate, to: AgendaDate): boolean {
  const d = AgendaDate.create(iso);
  return !d.isBefore(from) && !d.isAfter(to);
}
