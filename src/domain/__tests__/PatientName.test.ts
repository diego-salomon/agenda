import { describe, it, expect } from 'vitest';
import { PatientName } from '../value-objects/PatientName';

describe('PatientName', () => {
  it('trims and collapses whitespace', () => {
    expect(PatientName.create('  María   José  ').value).toBe('María José');
  });

  it('accepts accented and non-latin letters', () => {
    expect(PatientName.validate('José Ñandú')).toBeNull();
    expect(PatientName.validate('田中')).toBeNull();
  });

  it('rejects too-short, too-long, and letterless names', () => {
    expect(PatientName.validate('a')).not.toBeNull();
    expect(PatientName.validate('x'.repeat(81))).not.toBeNull();
    expect(PatientName.validate('12345')).not.toBeNull();
  });
});
