import type { Booking, Service } from '@/domain';
import type { BrandConfig, AgendaConfig } from '@/config/types';
import type { NotificationKind, NotificationMessage } from '../ports/NotificationGateway';
import { interpolate, formatLongDate } from '@/lib/format';

export interface ComposeInput {
  kind: NotificationKind;
  booking: Booking;
  service: Service;
  brand: BrandConfig;
  agenda: AgendaConfig;
  simulated: boolean;
}

/** Turn a notification template + booking into a ready-to-send message. */
export function composeNotification(input: ComposeInput): NotificationMessage {
  const { kind, booking, service, brand, agenda, simulated } = input;
  const template = agenda.notifications[kind];
  const body = interpolate(template, {
    business: brand.name,
    name: booking.patient.name.split(' ')[0] ?? booking.patient.name,
    service: service.name,
    date: formatLongDate(booking.date, brand.locale),
    time: booking.time,
    code: booking.code,
    address: `${brand.contact.address}, ${brand.contact.city}`,
  });
  return { kind, to: booking.patient.phone, body, simulated };
}
