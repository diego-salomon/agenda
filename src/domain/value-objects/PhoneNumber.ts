import { DomainError } from '../errors';

/**
 * Phone validation is driven by rules the brand supplies, never hardcoded to a
 * country. `defaultCountryCode` (E.164, e.g. "+595") is applied only when the
 * patient types a local number without a "+" prefix.
 */
export interface PhoneRules {
  minDigits: number;
  maxDigits: number;
  defaultCountryCode: string;
}

interface Normalized {
  e164: string;
  national: string;
}

function normalize(raw: string, rules: PhoneRules): Normalized | null {
  let cleaned = raw.trim().replace(/[\s().-]/g, '');
  if (cleaned.startsWith('00')) cleaned = `+${cleaned.slice(2)}`;

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    if (cleaned.slice(1) !== digits || digits.length === 0) return null;
    const cc = rules.defaultCountryCode.replace(/\D/g, '');
    const national = digits.startsWith(cc) ? digits.slice(cc.length) : digits;
    return { e164: `+${digits}`, national };
  }

  const digits = cleaned.replace(/\D/g, '');
  if (cleaned !== digits || digits.length === 0) return null;
  const national = digits.replace(/^0+/, '');
  return { e164: `${rules.defaultCountryCode}${national}`, national };
}

export class PhoneNumber {
  private constructor(
    readonly e164: string,
    readonly national: string,
  ) {}

  static validate(raw: string, rules: PhoneRules): string | null {
    const normalized = normalize(raw, rules);
    if (!normalized) return 'Teléfono inválido.';
    const len = normalized.national.length;
    if (len < rules.minDigits || len > rules.maxDigits) {
      return `El teléfono debe tener entre ${rules.minDigits} y ${rules.maxDigits} dígitos.`;
    }
    return null;
  }

  static create(raw: string, rules: PhoneRules): PhoneNumber {
    const error = PhoneNumber.validate(raw, rules);
    if (error) throw new DomainError(error);
    const normalized = normalize(raw, rules)!;
    return new PhoneNumber(normalized.e164, normalized.national);
  }

  equals(other: PhoneNumber): boolean {
    return this.e164 === other.e164;
  }
}
