/** Locale-driven formatting. Nothing here hardcodes a country or currency. */

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? vars[key] : `{${key}}`,
  );
}

function noonDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function formatCurrency(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatLongDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(noonDate(iso));
}

export function formatShortDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(
    noonDate(iso),
  );
}

export function formatWeekdayShort(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(noonDate(iso));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Build a WhatsApp deep link. E.164 in, "+" stripped as wa.me requires. */
export function whatsappLink(e164: string, text: string): string {
  const number = e164.replace(/[^\d]/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Google Maps search link from a free-text query. */
export function mapsLink(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
