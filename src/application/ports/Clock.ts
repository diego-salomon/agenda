/** Injected so "now" is controllable in tests and never read ad hoc. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};
