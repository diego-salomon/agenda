import {
  AgendaDate,
  BusinessHours,
  DayAggregate,
  DomainError,
  PatientName,
  PhoneNumber,
  TimeSlot,
  type Booking,
  type Service,
} from '@/domain';
import type { AgendaConfig, BrandConfig } from '@/config/types';
import type { AgendaRepository } from './ports/AgendaRepository';
import type { Clock } from './ports/Clock';
import type { CodeGenerator } from './ports/CodeGenerator';
import type { NotificationGateway, NotificationMessage } from './ports/NotificationGateway';
import { composeNotification } from './services/notificationComposer';

export type SlotStatus = 'free' | 'booked' | 'blocked' | 'past';

export interface DaySlot {
  time: string;
  status: SlotStatus;
}

export interface DaySlots {
  dateISO: string;
  open: boolean;
  slots: DaySlot[];
}

export interface WeekDay extends DaySlots {
  freeCount: number;
}

export interface WeekAgenda {
  startISO: string;
  days: WeekDay[];
}

export interface BookRequest {
  serviceId: string;
  dateISO: string;
  time: string;
  name: string;
  phone: string;
}

export interface BookResult {
  booking: Booking;
  service: Service;
  notification: NotificationMessage;
}

export interface LookupResult {
  booking: Booking;
  service: Service | null;
}

export interface AgendaServiceDeps {
  repo: AgendaRepository;
  clock: Clock;
  codes: CodeGenerator;
  notifications: NotificationGateway;
  brand: BrandConfig;
  agenda: AgendaConfig;
}

/**
 * The application facade the UI talks to. It owns the orchestration of use
 * cases over the repository port, the clock, the code generator and the
 * notification gateway — and knows nothing about where data is stored.
 */
export class AgendaService {
  private readonly hours: BusinessHours;

  constructor(private readonly deps: AgendaServiceDeps) {
    this.hours = new BusinessHours(deps.agenda.hours, deps.agenda.slotMinutes);
  }

  businessHours(): BusinessHours {
    return this.hours;
  }

  servicesCatalog(): Service[] {
    return this.deps.agenda.services;
  }

  findService(id: string): Service | null {
    return this.deps.agenda.services.find((s) => s.id === id) ?? null;
  }

  private slotStart(dateISO: string, time: string): Date {
    const [y, m, d] = dateISO.split('-').map(Number);
    const slot = TimeSlot.create(time);
    return new Date(y, m - 1, d, Math.floor(slot.minutes / 60), slot.minutes % 60, 0, 0);
  }

  private statusFor(day: DayAggregate, dateISO: string, slot: TimeSlot): SlotStatus {
    if (day.activeBookingAt(slot)) return 'booked';
    if (day.blockAt(slot)) return 'blocked';
    if (this.slotStart(dateISO, slot.toHHMM()).getTime() <= this.deps.clock.now().getTime()) {
      return 'past';
    }
    return 'free';
  }

  async daySlots(dateISO: string): Promise<DaySlots> {
    const date = AgendaDate.create(dateISO);
    const day = await this.deps.repo.loadDay(date);
    const gridSlots = this.hours.slotsFor(date);
    return {
      dateISO,
      open: gridSlots.length > 0,
      slots: gridSlots.map((slot) => ({
        time: slot.toHHMM(),
        status: this.statusFor(day, dateISO, slot),
      })),
    };
  }

  async weekAgenda(startISO: string): Promise<WeekAgenda> {
    const start = AgendaDate.create(startISO).startOfWeek();
    const days: WeekDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      const dateISO = start.addDays(i).toISO();
      const day = await this.daySlots(dateISO);
      days.push({ ...day, freeCount: day.slots.filter((s) => s.status === 'free').length });
    }
    return { startISO: start.toISO(), days };
  }

  async getDay(dateISO: string): Promise<DayAggregate> {
    return this.deps.repo.loadDay(AgendaDate.create(dateISO));
  }

  private async nextUniqueCode(): Promise<string> {
    for (let i = 0; i < 8; i += 1) {
      const code = this.deps.codes.next();
      // eslint-disable-next-line no-await-in-loop
      if (!(await this.deps.repo.findByCode(code))) return code;
    }
    throw new DomainError('No se pudo generar un código único, intenta de nuevo.');
  }

  async book(request: BookRequest): Promise<BookResult> {
    const service = this.findService(request.serviceId);
    if (!service) throw new DomainError('Servicio no encontrado.');

    const date = AgendaDate.create(request.dateISO);
    const slot = TimeSlot.create(request.time);

    if (!this.hours.containsSlot(date, slot)) {
      throw new DomainError('Ese horario está fuera del horario de atención.');
    }
    if (this.slotStart(request.dateISO, request.time).getTime() <= this.deps.clock.now().getTime()) {
      throw new DomainError('Ese horario ya pasó, elige otro.');
    }

    const name = PatientName.create(request.name);
    const phone = PhoneNumber.create(request.phone, this.deps.brand.phoneRules);

    const day = await this.deps.repo.loadDay(date);
    const code = await this.nextUniqueCode();
    const createdAt = this.deps.clock.now().toISOString();

    const updated = day.book({
      code,
      time: request.time,
      serviceId: service.id,
      patient: { name: name.value, phone: phone.e164 },
      createdAt,
    });
    await this.deps.repo.save(updated);

    const booking = updated.activeBookingAt(slot)!;
    const notification = composeNotification({
      kind: 'confirmation',
      booking,
      service,
      brand: this.deps.brand,
      agenda: this.deps.agenda,
      simulated: true,
    });
    await this.deps.notifications.send(notification);

    return { booking, service, notification };
  }

  async lookup(rawCode: string): Promise<LookupResult | null> {
    const booking = await this.deps.repo.findByCode(rawCode.trim().toUpperCase());
    if (!booking) return null;
    return { booking, service: this.findService(booking.serviceId) };
  }

  async cancel(rawCode: string): Promise<{ booking: Booking; notification: NotificationMessage }> {
    const code = rawCode.trim().toUpperCase();
    const existing = await this.deps.repo.findByCode(code);
    if (!existing) throw new DomainError('No encontramos una reserva con ese código.', 'BOOKING_NOT_FOUND');

    const date = AgendaDate.create(existing.date);
    const day = await this.deps.repo.loadDay(date);
    const cancelledAt = this.deps.clock.now().toISOString();
    const updated = day.cancel(code, cancelledAt);
    await this.deps.repo.save(updated);

    const booking = updated.findByCode(code)!;
    const service = this.findService(booking.serviceId);
    const notification = composeNotification({
      kind: 'cancellation',
      booking,
      service: service ?? fallbackService(booking.serviceId),
      brand: this.deps.brand,
      agenda: this.deps.agenda,
      simulated: true,
    });
    await this.deps.notifications.send(notification);
    return { booking, notification };
  }

  // ---- Admin operations -------------------------------------------------

  async adminCancel(code: string): Promise<void> {
    await this.cancel(code);
  }

  async adminMarkAttended(dateISO: string, code: string): Promise<void> {
    const day = await this.getDay(dateISO);
    await this.deps.repo.save(day.markAttended(code));
  }

  async adminBlock(dateISO: string, time: string, reason?: string): Promise<void> {
    const day = await this.getDay(dateISO);
    await this.deps.repo.save(day.block(time, reason, this.deps.clock.now().toISOString()));
  }

  async adminFree(dateISO: string, time: string): Promise<void> {
    const day = await this.getDay(dateISO);
    await this.deps.repo.save(day.free(time));
  }

  /** Move a booking, within the same day or across days. */
  async adminMove(code: string, toDateISO: string, toTime: string): Promise<void> {
    const existing = await this.deps.repo.findByCode(code);
    if (!existing) throw new DomainError('Reserva no encontrada.', 'BOOKING_NOT_FOUND');

    if (existing.date === toDateISO) {
      const day = await this.getDay(toDateISO);
      await this.deps.repo.save(day.moveWithinDay(code, toTime));
      return;
    }

    // Cross-day move: place in the destination first, then release the origin,
    // so a clash on the destination leaves the original booking untouched.
    const destination = await this.getDay(toDateISO);
    const withDestination = destination.book({
      code,
      time: toTime,
      serviceId: existing.serviceId,
      patient: existing.patient,
      createdAt: existing.createdAt,
    });
    const originDay = await this.getDay(existing.date);
    await this.deps.repo.save(withDestination);
    await this.deps.repo.save(originDay.cancel(code, this.deps.clock.now().toISOString()));
  }

  async resetDemo(): Promise<void> {
    await this.deps.repo.resetDemo();
  }

  sentNotifications(): readonly NotificationMessage[] {
    return this.deps.notifications.recorded?.() ?? [];
  }
}

function fallbackService(id: string): Service {
  return {
    id,
    name: 'Servicio',
    summary: '',
    description: '',
    benefits: [],
    durationMinutes: 60,
    price: 0,
    imageUrl: '',
    imageAlt: '',
    imageWidth: 0,
    imageHeight: 0,
  };
}
