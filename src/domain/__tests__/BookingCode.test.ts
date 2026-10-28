import { describe, it, expect } from 'vitest';
import { BookingCode } from '../value-objects/BookingCode';

describe('BookingCode', () => {
  it('uppercases and validates format', () => {
    expect(BookingCode.create('abc234').value).toBe('ABC234');
    expect(BookingCode.validate('ABC234')).toBeNull();
  });

  it('rejects ambiguous glyphs and wrong lengths', () => {
    expect(BookingCode.validate('ABC23O')).not.toBeNull(); // O not allowed
    expect(BookingCode.validate('ABC2I4')).not.toBeNull(); // I not allowed
    expect(BookingCode.validate('ABC23')).not.toBeNull(); // too short
  });

  it('generates a valid code from an injected RNG', () => {
    const code = BookingCode.generate(() => 0); // always first char 'A'
    expect(code.value).toBe('AAAAAA');
    expect(BookingCode.validate(code.value)).toBeNull();
  });
});
