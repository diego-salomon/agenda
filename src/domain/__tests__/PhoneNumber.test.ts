import { describe, it, expect } from 'vitest';
import { PhoneNumber, type PhoneRules } from '../value-objects/PhoneNumber';

// Rules are supplied by the brand, never hardcoded. These mimic a PY locale.
const py: PhoneRules = { minDigits: 9, maxDigits: 9, defaultCountryCode: '+595' };

describe('PhoneNumber', () => {
  it('prepends the default country code to a local number', () => {
    expect(PhoneNumber.create('0981 123 456', py).e164).toBe('+595981123456');
  });

  it('keeps an already-international number', () => {
    expect(PhoneNumber.create('+595 981 123 456', py).e164).toBe('+595981123456');
  });

  it('normalizes a 00-prefixed international number', () => {
    expect(PhoneNumber.create('00595981123456', py).e164).toBe('+595981123456');
  });

  it('strips the leading zero from the national part', () => {
    expect(PhoneNumber.create('0981123456', py).national).toBe('981123456');
  });

  it('enforces the brand digit-count rules', () => {
    expect(PhoneNumber.validate('123', py)).not.toBeNull();
    expect(PhoneNumber.validate('0981123456', py)).toBeNull();
  });

  it('adapts to a different locale without code changes', () => {
    const mx: PhoneRules = { minDigits: 10, maxDigits: 10, defaultCountryCode: '+52' };
    expect(PhoneNumber.create('55 1234 5678', mx).e164).toBe('+525512345678');
    expect(PhoneNumber.validate('0981123456', mx)).not.toBeNull(); // 9 digits, too short for MX
  });

  it('rejects letters and empty input', () => {
    expect(PhoneNumber.validate('abcdefghi', py)).not.toBeNull();
    expect(PhoneNumber.validate('', py)).not.toBeNull();
  });
});
