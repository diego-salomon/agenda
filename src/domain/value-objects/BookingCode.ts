import { DomainError } from '../errors';

/** Crockford-style alphabet with no ambiguous glyphs (no I, O, 0, 1). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LENGTH = 6;
const CODE = /^[A-HJ-NP-Z2-9]{6}$/;

/** A short, human-friendly code the patient keeps to look up or cancel. */
export class BookingCode {
  private constructor(readonly value: string) {}

  static validate(raw: string): string | null {
    const value = raw.trim().toUpperCase();
    if (!CODE.test(value)) return 'Código inválido.';
    return null;
  }

  static create(raw: string): BookingCode {
    const value = raw.trim().toUpperCase();
    if (!CODE.test(value)) throw new DomainError('Código inválido.');
    return new BookingCode(value);
  }

  /** Generation is parameterized on a RNG so it stays deterministic in tests. */
  static generate(random: () => number = Math.random): BookingCode {
    let value = '';
    for (let i = 0; i < LENGTH; i += 1) {
      value += ALPHABET[Math.floor(random() * ALPHABET.length)];
    }
    return new BookingCode(value);
  }

  equals(other: BookingCode): boolean {
    return this.value === other.value;
  }
}
