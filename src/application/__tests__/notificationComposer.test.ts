import { describe, it, expect } from 'vitest';
import { composeNotification } from '../services/notificationComposer';
import { brand } from '@/config/brand.config';
import { agenda } from '@/config/agenda.config';
import type { Booking } from '@/domain';

const booking: Booking = {
  code: 'ABC234',
  date: '2026-10-28',
  time: '09:00',
  serviceId: 'consulta-inicial',
  patient: { name: 'Ada Lovelace', phone: '+595981123456' },
  status: 'confirmed',
  createdAt: '2026-10-20T09:00:00.000Z',
};

const service = agenda.services[0];

describe('composeNotification', () => {
  it('interpolates every placeholder for the confirmation', () => {
    const msg = composeNotification({
      kind: 'confirmation',
      booking,
      service,
      brand,
      agenda,
      simulated: true,
    });
    expect(msg.body).toContain('Ada'); // first name only
    expect(msg.body).toContain('Consulta inicial');
    expect(msg.body).toContain('ABC234');
    expect(msg.body).toContain('Estudio Aurora');
    expect(msg.body).not.toMatch(/\{[a-z]+\}/); // no leftover placeholders
    expect(msg.to).toBe('+595981123456');
  });

  it('uses the right template per kind', () => {
    const cancellation = composeNotification({
      kind: 'cancellation',
      booking,
      service,
      brand,
      agenda,
      simulated: true,
    });
    expect(cancellation.body).toContain('cancelado');
  });
});
