import { describe, it, expect } from 'vitest';
import { BusinessHours } from '../entities/BusinessHours';
import { AgendaDate } from '../value-objects/AgendaDate';

const hours = new BusinessHours(
  {
    // Wednesday: morning + afternoon split by lunch
    3: [
      { from: '08:00', to: '11:00' },
      { from: '14:00', to: '16:00' },
    ],
    0: [], // Sunday closed
  },
  60,
);

describe('BusinessHours', () => {
  const wednesday = AgendaDate.create('2026-10-28');
  const sunday = AgendaDate.create('2026-11-01');

  it('lays out the grid inside each tramo and skips the lunch gap', () => {
    const times = hours.slotsFor(wednesday).map((s) => s.toHHMM());
    expect(times).toEqual(['08:00', '09:00', '10:00', '14:00', '15:00']);
  });

  it('reports open and closed days', () => {
    expect(hours.isOpenOn(wednesday)).toBe(true);
    expect(hours.isOpenOn(sunday)).toBe(false);
    expect(hours.slotsFor(sunday)).toEqual([]);
  });

  it('respects the slot length', () => {
    const half = new BusinessHours({ 3: [{ from: '08:00', to: '09:00' }] }, 30);
    expect(half.slotsFor(wednesday).map((s) => s.toHHMM())).toEqual(['08:00', '08:30']);
  });
});
