export { DomainError } from './errors';
export type { DomainErrorCode } from './errors';
export type { Weekday, BookingStatus } from './types';
export { occupiesSlot } from './types';

export { AgendaDate } from './value-objects/AgendaDate';
export { TimeSlot } from './value-objects/TimeSlot';
export { PhoneNumber } from './value-objects/PhoneNumber';
export type { PhoneRules } from './value-objects/PhoneNumber';
export { PatientName } from './value-objects/PatientName';
export { BookingCode } from './value-objects/BookingCode';

export type { Service } from './entities/Service';
export { BusinessHours } from './entities/BusinessHours';
export type { Tramo, WeeklyHours } from './entities/BusinessHours';
export type { Booking, Patient } from './entities/Booking';
export type { Block } from './entities/Block';
export { DayAggregate } from './entities/DayAggregate';
export type { BookInput } from './entities/DayAggregate';
