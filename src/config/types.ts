import type { Service, WeeklyHours, PhoneRules } from '@/domain';

/** One color scheme (light or dark) expressed as the brand's overridable hues. */
export interface PaletteScheme {
  /** Primary brand color (buttons, highlights). */
  brand: string;
  /** Readable text/icon color on top of `brand`. */
  brandContrast: string;
  /** Secondary accent used sparingly. */
  accent: string;
}

export interface BrandPalette {
  light: PaletteScheme;
  dark: PaletteScheme;
}

export interface BrandContact {
  address: string;
  city: string;
  country: string;
  phoneDisplay: string;
  phoneE164: string;
  email: string;
  whatsappE164: string;
  /** Raw query handed to Google Maps, e.g. the full address or a place name. */
  mapsQuery: string;
}

export interface BrandSocial {
  label: string;
  href: string;
}

export interface BrandConfig {
  name: string;
  tagline: string;
  logoUrl: string;
  /** BCP-47 locale, e.g. "es-PY". Drives date and currency formatting. */
  locale: string;
  /** ISO-4217 currency, e.g. "PYG". */
  currency: string;
  contact: BrandContact;
  socials: BrandSocial[];
  palette: BrandPalette;
  /**
   * Phone validation rules. Conceptually derived from `locale`; kept explicit
   * here so a client can tune them without touching code.
   */
  phoneRules: PhoneRules;
}

/**
 * Notification copy. Placeholders are interpolated at send time:
 * {business} {name} {service} {date} {time} {code} {address}
 */
export interface NotificationTemplates {
  confirmation: string;
  reminder: string;
  cancellation: string;
}

export interface AgendaConfig {
  services: Service[];
  hours: WeeklyHours;
  slotMinutes: number;
  /** How many hours before the appointment the reminder is due. */
  reminderLeadHours: number;
  notifications: NotificationTemplates;
}
