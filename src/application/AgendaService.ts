import {
  AgendaDate,
  BookingCode,
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

export interface DayView {
  day: DayAggregate;
  slots: DaySlot[];
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
  /** True in demo mode: notifications are simulated, demo-only UI shows. */
  demoMode: boolean;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * The application facade the UI talks to. It owns the orchestration of use
 * cases over the repository port, the clock, the code generator and the
 * notification gateway — and knows nothing about where data is stored.
 *
 * Service duration lives in the catalog (config), so duration-aware
 * availability — a booking occupies its whole [start, start+duration) span,
 * not just one grid cell — is computed here, while DayAggregate keeps the
 * exact-slot invariant as a backstop.
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

  private durationOf(serviceId: string): number {
    return this.findService(serviceId)?.durationMinutes ?? this.deps.agenda.slotMinutes;
  }

  private slotStart(dateISO: string, time: string): Date {
    const [y, m, d] = dateISO.split('-').map(Number);
    const minutes = TimeSlot.create(time).minutes;
    return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0);
  }

  /** A grid slot is covered when any active booking's span overlaps its start. */
  private isCovered(day: DayAggregate, slotMinutes: number): boolean {
    return day.bookings.some((b) => {
      if (b.status !== 'confirmed' && b.status !== 'attended') return false;
      const start = TimeSlot.create(b.time).minutes;
      return slotMinutes >= start && slotMinutes < start + this.durationOf(b.serviceId);
    });
  }

  private statusFor(day: DayAggregate, dateISO: string, slot: TimeSlot): SlotStatus {
    if (this.isCovered(day, slot.minutes)) return 'booked';
    if (day.blockAt(slot)) return 'blocked';
    if (this.slotStart(dateISO, slot.toHHMM()).getTime() <= this.deps.clock.now().getTime()) {
      return 'past';
    }
    return 'free';
  }

  private slotsFromDay(day: DayAggregate, dateISO: string): DaySlot[] {
    return this.hours.slotsFor(AgendaDate.create(dateISO)).map((slot) => ({
      time: slot.toHHMM(),
      status: this.statusFor(day, dateISO, slot),
    }));
  }

  async daySlots(dateISO: string): Promise<DaySlots> {
    const date = AgendaDate.create(dateISO);
    const day = await this.deps.repo.loadDay(date);
    const slots = this.slotsFromDay(day, dateISO);
    return { dateISO, open: this.hours.isOpenOn(date), slots };
  }

  /** The full aggregate plus its slot view, in a single repository load. */
  async loadDayView(dateISO: string): Promise<DayView> {
    const day = await this.deps.repo.loadDay(AgendaDate.create(dateISO));
    return { day, slots: this.slotsFromDay(day, dateISO) };
  }

  async weekAgenda(startISO: string): Promise<WeekAgenda> {
    const start = AgendaDate.create(startISO).startOfWeek();
    const days: WeekDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      const day = await this.daySlots(start.addDays(i).toISO());
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
      if (!(await this.deps.repo.findByCode(code))) return code;
    }
    throw new DomainError('No se pudo generar un código único, intenta de nuevo.');
  }

  /** Does `[start, start+duration)` clash with any booking span or block? */
  private spanIsFree(day: DayAggregate, start: number, duration: number): boolean {
    const end = start + duration;
    const bookingClash = day.bookings.some((b) => {
      if (b.status !== 'confirmed' && b.status !== 'attended') return false;
      const bStart = TimeSlot.create(b.time).minutes;
      return start < bStart + this.durationOf(b.serviceId) && bStart < end;
    });
    if (bookingClash) return false;
    return !day.blocks.some((bl) => {
      const blStart = TimeSlot.create(bl.time).minutes;
      return start < blStart + this.deps.agenda.slotMinutes && blStart < end;
    });
  }

  async book(request: BookRequest): Promise<BookResult> {
    const service = this.findService(request.serviceId);
    if (!service) throw new DomainError('Servicio no encontrado.');

    const date = AgendaDate.create(request.dateISO);
    const slot = TimeSlot.create(request.time);

    if (!this.hours.containsSlot(date, slot)) {
      throw new DomainError('Ese horario está fuera del horario de atención.');
    }
    if (!this.hours.canFit(date, slot, service.durationMinutes)) {
      throw new DomainError('No hay tiempo suficiente antes del cierre para ese servicio.');
    }
    if (this.slotStart(request.dateISO, request.time).getTime() <= this.deps.clock.now().getTime()) {
      throw new DomainError('Ese horario ya pasó, elige otro.');
    }

    const name = PatientName.create(request.name);
    const phone = PhoneNumber.create(request.phone, this.deps.brand.phoneRules);

    const day = await this.deps.repo.loadDay(date);
    if (!this.spanIsFree(day, slot.minutes, service.durationMinutes)) {
      throw new DomainError('Ese horario ya no está disponible.', 'SLOT_TAKEN');
    }

    const code = await this.nextUniqueCode();
    const updated = day.book({
      code,
      time: request.time,
      serviceId: service.id,
      patient: { name: name.value, phone: phone.e164 },
      createdAt: this.deps.clock.now().toISOString(),
    });
    await this.deps.repo.save(updated);

    const booking = updated.findByCode(code)!;
    const notification = this.compose('confirmation', booking, service);
    await this.notify(notification);
    return { booking, service, notification };
  }

  async lookup(rawCode: string): Promise<LookupResult | null> {
    const booking = await this.deps.repo.findByCode(BookingCode.normalize(rawCode));
    if (!booking) return null;
    return { booking, service: this.findService(booking.serviceId) };
  }

  async cancel(rawCode: string): Promise<{ booking: Booking; notification: NotificationMessage }> {
    const code = BookingCode.normalize(rawCode);
    const existing = await this.deps.repo.findByCode(code);
    if (!existing) {
      throw new DomainError('No encontramos una reserva con ese código.', 'BOOKING_NOT_FOUND');
    }

    const day = await this.deps.repo.loadDay(AgendaDate.create(existing.date));
    const updated = day.cancel(code, this.deps.clock.now().toISOString());
    await this.deps.repo.save(updated);

    const booking = updated.findByCode(code)!;
    const service = this.findService(booking.serviceId) ?? fallbackService(booking.serviceId);
    const notification = this.compose('cancellation', booking, service);
    await this.notify(notification);
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

  /** Move a booking to another free slot on the same day. */
  async adminMove(code: string, toTime: string): Promise<void> {
    const existing = await this.deps.repo.findByCode(code);
    if (!existing) throw new DomainError('Reserva no encontrada.', 'BOOKING_NOT_FOUND');
    const day = await this.getDay(existing.date);
    await this.deps.repo.save(day.moveWithinDay(code, toTime));
  }

  async resetDemo(): Promise<void> {
    await this.deps.repo.resetDemo();
  }

  /** Confirmed bookings whose start falls inside the reminder window. */
  private async dueBookings(now: Date, onlyUnreminded: boolean): Promise<Booking[]> {
    const until = new Date(now.getTime() + this.deps.agenda.reminderLeadHours * HOUR_MS);
    const bookings = await this.deps.repo.bookingsBetween(
      AgendaDate.fromDate(now),
      AgendaDate.fromDate(until),
    );
    return bookings.filter((b) => {
      if (b.status !== 'confirmed') return false;
      if (onlyUnreminded && b.remindedAt) return false;
      const t = this.slotStart(b.date, b.time).getTime();
      return t > now.getTime() && t <= until.getTime();
    });
  }

  /** Pending reminders: due within the window and not yet sent (preview/queue). */
  async dueReminders(now: Date = this.deps.clock.now()): Promise<NotificationMessage[]> {
    const bookings = await this.dueBookings(now, true);
    return bookings.map((b) =>
      this.compose('reminder', b, this.findService(b.serviceId) ?? fallbackService(b.serviceId)),
    );
  }

  /**
   * Send a reminder for every due booking not yet reminded, then mark it so a
   * later run never sends twice. This is the job a scheduler runs — daily in
   * production via the Supabase `reminders` function (supabase/functions/reminders);
   * in demo mode the gateway records each message as "simulado". A send failure
   * leaves that booking un-reminded so the next run retries it. Returns the
   * messages actually sent.
   */
  async sendDueReminders(now: Date = this.deps.clock.now()): Promise<NotificationMessage[]> {
    const sent: NotificationMessage[] = [];
    for (const booking of await this.dueBookings(now, true)) {
      const service = this.findService(booking.serviceId) ?? fallbackService(booking.serviceId);
      const message = this.compose('reminder', booking, service);
      try {
        await this.deps.notifications.send(message);
      } catch {
        continue; // retried on the next run
      }
      const day = await this.deps.repo.loadDay(AgendaDate.create(booking.date));
      await this.deps.repo.save(day.markReminded(booking.code, now.toISOString()));
      sent.push(message);
    }
    return sent;
  }

  sentNotifications(): readonly NotificationMessage[] {
    return this.deps.notifications.recorded?.() ?? [];
  }

  private compose(
    kind: NotificationMessage['kind'],
    booking: Booking,
    service: Service,
  ): NotificationMessage {
    return composeNotification({
      kind,
      booking,
      service,
      brand: this.deps.brand,
      agenda: this.deps.agenda,
      simulated: this.deps.demoMode,
    });
  }

  /** Notifications are best-effort: a send failure must not undo a saved booking. */
  private async notify(message: NotificationMessage): Promise<void> {
    try {
      await this.deps.notifications.send(message);
    } catch {
      // swallowed on purpose — the booking is already persisted
    }
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
