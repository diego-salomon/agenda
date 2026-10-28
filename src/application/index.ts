export { AgendaService } from './AgendaService';
export type {
  AgendaServiceDeps,
  BookRequest,
  BookResult,
  LookupResult,
  DaySlot,
  DaySlots,
  WeekDay,
  WeekAgenda,
  SlotStatus,
} from './AgendaService';

export type { AgendaRepository } from './ports/AgendaRepository';
export { systemClock } from './ports/Clock';
export type { Clock } from './ports/Clock';
export { bookingCodeGenerator } from './ports/CodeGenerator';
export type { CodeGenerator } from './ports/CodeGenerator';
export type {
  NotificationGateway,
  NotificationMessage,
  NotificationKind,
} from './ports/NotificationGateway';
export { composeNotification } from './services/notificationComposer';
