/**
 * The only error type the domain throws. Carrying a human-readable, localized
 * message lets the UI surface it directly; carrying a stable `code` lets the
 * application layer branch without string matching.
 */
export type DomainErrorCode =
  | 'INVALID_VALUE'
  | 'SLOT_TAKEN'
  | 'SLOT_BLOCKED'
  | 'BOOKING_NOT_FOUND'
  | 'INVARIANT_VIOLATION';

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(message: string, code: DomainErrorCode = 'INVALID_VALUE') {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
