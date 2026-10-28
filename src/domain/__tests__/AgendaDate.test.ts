import { describe, it, expect } from 'vitest';
import { AgendaDate } from '../value-objects/AgendaDate';
import { DomainError } from '../errors';

describe('AgendaDate', () => {
  it('round-trips a valid ISO date', () => {
    expect(AgendaDate.create('2026-02-28').toISO()).toBe('2026-02-28');
  });

  it('accepts a leap day and rejects a non-leap Feb 29', () => {
    expect(AgendaDate.create('2024-02-29').toISO()).toBe('2024-02-29');
    expect(() => AgendaDate.create('2026-02-29')).toThrow(DomainError);
  });

  it('rejects malformed and out-of-range input', () => {
    expect(AgendaDate.validate('2026-13-01')).not.toBeNull();
    expect(AgendaDate.validate('26-01-01')).not.toBeNull();
    expect(AgendaDate.validate('')).not.toBeNull();
  });

  it('computes weekday with JS convention (0=Sunday)', () => {
    expect(AgendaDate.create('2026-10-28').weekday()).toBe(3); // Wednesday
    expect(AgendaDate.create('2026-11-01').weekday()).toBe(0); // Sunday
  });

  it('adds days across a month boundary', () => {
    expect(AgendaDate.create('2026-01-31').addDays(1).toISO()).toBe('2026-02-01');
    expect(AgendaDate.create('2026-03-01').addDays(-1).toISO()).toBe('2026-02-28');
  });

  it('snaps to Monday as the start of the week', () => {
    // 2026-10-28 is a Wednesday
    expect(AgendaDate.create('2026-10-28').startOfWeek().toISO()).toBe('2026-10-26');
    // Sunday belongs to the week that started the previous Monday
    expect(AgendaDate.create('2026-11-01').startOfWeek().toISO()).toBe('2026-10-26');
  });

  it('orders dates', () => {
    const a = AgendaDate.create('2026-01-01');
    const b = AgendaDate.create('2026-01-02');
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(a.equals(AgendaDate.create('2026-01-01'))).toBe(true);
  });
});
