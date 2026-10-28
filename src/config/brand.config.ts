import type { BrandConfig } from './types';

/**
 * WHITE-LABEL FILE 1 of 2.
 *
 * Everything client-specific about identity and contact lives here. No brand
 * strings belong in components — they read from this object. Swap these values
 * (and the palette) to rebrand the whole app.
 *
 * The values below are generic DEMO data for a fictional studio. They ship with
 * the portfolio/demo build and should be replaced per client.
 */
export const brand: BrandConfig = {
  name: 'Estudio Aurora',
  tagline: 'Reserva tu sesión en menos de un minuto.',
  logoUrl: '/img/logo.svg',
  locale: 'es-PY',
  currency: 'PYG',

  contact: {
    address: 'Av. del Ejemplo 1234',
    city: 'Asunción',
    country: 'Paraguay',
    phoneDisplay: '(021) 555 0123',
    phoneE164: '+595215550123',
    email: 'hola@estudioaurora.example',
    whatsappE164: '+595981555012',
    mapsQuery: 'Av. del Ejemplo 1234, Asunción, Paraguay',
  },

  socials: [
    { label: 'Instagram', href: 'https://instagram.com/estudioaurora.example' },
    { label: 'Facebook', href: 'https://facebook.com/estudioaurora.example' },
  ],

  palette: {
    light: { brand: '#2f5bea', brandContrast: '#ffffff', accent: '#0f9d8f' },
    dark: { brand: '#7d97ff', brandContrast: '#0b1020', accent: '#2dd4bf' },
  },

  // Defaults suited to the es-PY locale; tune per client.
  phoneRules: { minDigits: 9, maxDigits: 10, defaultCountryCode: '+595' },
};
