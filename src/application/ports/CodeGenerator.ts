import { BookingCode } from '@/domain';

/** Produces booking codes. Injected so tests can make them deterministic. */
export interface CodeGenerator {
  next(): string;
}

export const bookingCodeGenerator: CodeGenerator = {
  next: () => BookingCode.generate().value,
};
