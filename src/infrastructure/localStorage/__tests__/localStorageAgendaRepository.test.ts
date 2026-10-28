import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAgendaRepository } from '../localStorageAgendaRepository';
import { AgendaDate, DayAggregate } from '@/domain';
import type { Clock } from '@/application';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const clock: Clock = { now: () => new Date('2026-10-20T09:00:00') };

describe('LocalStorageAgendaRepository', () => {
  let storage: MemoryStorage;
  let repo: LocalStorageAgendaRepository;

  beforeEach(() => {
    storage = new MemoryStorage();
    repo = new LocalStorageAgendaRepository(storage, clock);
  });

  it('seeds demo data on first read', async () => {
    const all = await repo.bookingsBetween(
      AgendaDate.create('2026-10-20'),
      AgendaDate.create('2026-11-30'),
    );
    expect(all.length).toBeGreaterThan(0);
  });

  it('persists a saved day and reloads it', async () => {
    const date = AgendaDate.create('2026-10-28');
    const day = (await repo.loadDay(date)).book({
      code: 'ABC234',
      time: '09:00',
      serviceId: 'consulta-inicial',
      patient: { name: 'Ada', phone: '+595981123456' },
      createdAt: clock.now().toISOString(),
    });
    await repo.save(day);

    const reloaded = await repo.loadDay(date);
    expect(reloaded.findByCode('ABC234')?.time).toBe('09:00');
    expect(await repo.findByCode('ABC234')).not.toBeNull();
  });

  it('only replaces the saved day, leaving other days intact', async () => {
    const before = await repo.bookingsBetween(
      AgendaDate.create('2026-10-20'),
      AgendaDate.create('2026-11-30'),
    );
    const date = AgendaDate.create('2026-12-02');
    await repo.save(
      DayAggregate.create(date).block('09:00', 'test', clock.now().toISOString()),
    );
    const after = await repo.bookingsBetween(
      AgendaDate.create('2026-10-20'),
      AgendaDate.create('2026-11-30'),
    );
    expect(after.length).toBe(before.length);
  });

  it('resets demo data', async () => {
    const date = AgendaDate.create('2026-10-28');
    await repo.save(
      (await repo.loadDay(date)).book({
        code: 'ZZZ999',
        time: '09:00',
        serviceId: 'consulta-inicial',
        patient: { name: 'Ada', phone: '+595981123456' },
        createdAt: clock.now().toISOString(),
      }),
    );
    await repo.resetDemo();
    expect(await repo.findByCode('ZZZ999')).toBeNull();
  });
});
