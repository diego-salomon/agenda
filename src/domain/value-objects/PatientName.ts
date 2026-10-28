import { DomainError } from '../errors';

/** A patient's display name: trimmed, 2-80 chars, must contain a letter. */
export class PatientName {
  private constructor(readonly value: string) {}

  static validate(raw: string): string | null {
    const value = raw.trim().replace(/\s+/g, ' ');
    if (value.length < 2) return 'Ingresa tu nombre.';
    if (value.length > 80) return 'El nombre es demasiado largo.';
    if (!/\p{L}/u.test(value)) return 'El nombre debe contener letras.';
    return null;
  }

  static create(raw: string): PatientName {
    const error = PatientName.validate(raw);
    if (error) throw new DomainError(error);
    return new PatientName(raw.trim().replace(/\s+/g, ' '));
  }
}
