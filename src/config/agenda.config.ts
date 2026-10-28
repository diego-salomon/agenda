import type { AgendaConfig } from './types';

/**
 * WHITE-LABEL FILE 2 of 2.
 *
 * The services catalog, opening hours and notification copy. Generic DEMO data;
 * replace per client. Prices are in the brand currency's minor-unit-free value
 * (PYG has no decimals, so these are whole guaraníes).
 */
export const agenda: AgendaConfig = {
  slotMinutes: 60,
  reminderLeadHours: 24,

  services: [
    {
      id: 'consulta-inicial',
      name: 'Consulta inicial',
      summary: 'Primera visita para conocerte y trazar un plan.',
      description:
        'Una sesión pensada para la primera vez: conversamos sobre tus objetivos, resolvemos dudas y definimos los próximos pasos juntos.',
      benefits: ['Evaluación personalizada', 'Plan a tu medida', 'Sin compromiso'],
      durationMinutes: 60,
      price: 180000,
      imageUrl: '/img/service-consulta.svg',
      imageAlt: 'Espacio tranquilo para la consulta inicial',
      imageWidth: 800,
      imageHeight: 600,
    },
    {
      id: 'sesion-seguimiento',
      name: 'Sesión de seguimiento',
      summary: 'Continuidad del plan acordado.',
      description:
        'Para quienes ya iniciaron: damos seguimiento al progreso, ajustamos lo necesario y mantenemos el ritmo.',
      benefits: ['Seguimiento del progreso', 'Ajustes continuos'],
      durationMinutes: 60,
      price: 140000,
      imageUrl: '/img/service-seguimiento.svg',
      imageAlt: 'Detalle de una sesión de seguimiento',
      imageWidth: 800,
      imageHeight: 600,
    },
    {
      id: 'sesion-extendida',
      name: 'Sesión extendida',
      summary: 'Más tiempo para un trabajo a fondo.',
      description:
        'El doble de tiempo para temas que requieren profundidad, sin apuros y con foco en el detalle.',
      benefits: ['90 minutos', 'Trabajo en profundidad', 'Ideal para casos complejos'],
      durationMinutes: 90,
      price: 250000,
      imageUrl: '/img/service-extendida.svg',
      imageAlt: 'Ambiente amplio para una sesión extendida',
      imageWidth: 800,
      imageHeight: 600,
    },
  ],

  // 0 = Sunday ... 6 = Saturday
  hours: {
    1: [{ from: '08:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
    2: [{ from: '08:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
    3: [{ from: '08:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
    4: [{ from: '08:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
    5: [{ from: '08:00', to: '12:00' }, { from: '14:00', to: '18:00' }],
    6: [{ from: '09:00', to: '13:00' }],
    0: [],
  },

  notifications: {
    confirmation:
      '¡Hola, {name}! Tu turno en {business} quedó confirmado: {service} el {date} a las {time}. Tu código es {code}. Te esperamos en {address}.',
    reminder:
      'Hola, {name}. Te recordamos tu turno en {business}: {service} mañana {date} a las {time}. Código {code}. Si no puedes asistir, avísanos.',
    cancellation:
      'Hola, {name}. Tu turno del {date} a las {time} en {business} fue cancelado. Cuando quieras, puedes reservar otro horario.',
  },
};
