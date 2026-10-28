import { describe, it, expect } from 'vitest';
import { TimeSlot } from '../value-objects/TimeSlot';
import { DomainError } from '../errors';

describe('TimeSlot', () => {
  it('parses HH:MM into minutes-of-day and back', () => {
    expect(TimeSlot.create('09:30').minutes).toBe(570);
    expect(TimeSlot.create('00:00').toHHMM()).toBe('00:00');
    expect(TimeSlot.fromMinutes(570).toHHMM()).toBe('09:30');
  });

  it('rejects invalid times', () => {
    expect(TimeSlot.validate('24:00')).not.toBeNull();
    expect(TimeSlot.validate('09:60')).not.toBeNull();
    expect(TimeSlot.validate('9:30')).not.toBeNull();
    expect(() => TimeSlot.fromMinutes(1440)).toThrow(DomainError);
  });

  it('adds minutes and compares', () => {
    expect(TimeSlot.create('09:00').plusMinutes(90).toHHMM()).toBe('10:30');
    expect(TimeSlot.create('09:00').isBefore(TimeSlot.create('10:00'))).toBe(true);
    expect(TimeSlot.create('09:00').equals(TimeSlot.create('09:00'))).toBe(true);
  });
});
