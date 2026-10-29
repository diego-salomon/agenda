import { AgendaDate } from '@/domain';
import { useApp } from '../AppContext';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { Badge, Card, buttonClasses } from '../components';
import { formatCurrency, formatDuration, mapsLink } from '@/lib/format';
import { asset } from '@/lib/asset';
import { todayISO } from '../lib/days';

export function CentroPage() {
  const { brand, agenda } = useApp();
  useDocumentHead('El centro', `${brand.name} · ${brand.contact.city}, ${brand.contact.country}`);

  // Monday-first week used only to label the hours table.
  const monday = AgendaDate.create(todayISO()).startOfWeek();
  const week = Array.from({ length: 7 }, (_, i) => monday.addDays(i));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">{brand.name}</h1>
        <p className="text-text-muted">{brand.tagline}</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold text-text">Contacto</h2>
          <address className="flex flex-col gap-1 not-italic text-text-muted">
            <span>{brand.contact.address}</span>
            <span>
              {brand.contact.city}, {brand.contact.country}
            </span>
            <a href={`tel:${brand.contact.phoneE164}`} className="text-brand hover:underline">
              {brand.contact.phoneDisplay}
            </a>
            <a href={`mailto:${brand.contact.email}`} className="text-brand hover:underline">
              {brand.contact.email}
            </a>
          </address>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              className={buttonClasses('secondary')}
              href={mapsLink(brand.contact.mapsQuery)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en Google Maps
            </a>
            {brand.socials.map((s) => (
              <a
                key={s.href}
                className={buttonClasses('ghost')}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label}
              </a>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold text-text">Horario de atención</h2>
          <table className="w-full text-sm">
            <tbody>
              {week.map((d) => {
                const tramos = agenda.hours[d.weekday()] ?? [];
                const label = new Intl.DateTimeFormat(brand.locale, { weekday: 'long' }).format(
                  new Date(d.year, d.month - 1, d.day, 12),
                );
                return (
                  <tr key={d.toISO()} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2 text-left font-medium first-letter:uppercase text-text">
                      {label}
                    </th>
                    <td className="py-2 text-right text-text-muted">
                      {tramos.length === 0
                        ? 'Cerrado'
                        : tramos.map((t) => `${t.from}–${t.to}`).join(' · ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Servicios</h2>
        <ul className="grid gap-4 md:grid-cols-2" role="list">
          {agenda.services.map((s) => (
            <li key={s.id}>
              <Card className="flex h-full gap-4 p-4">
                <img
                  src={asset(s.imageUrl)}
                  alt={s.imageAlt}
                  width={s.imageWidth}
                  height={s.imageHeight}
                  className="h-24 w-24 flex-shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text">{s.name}</h3>
                    <Badge tone="muted">{formatDuration(s.durationMinutes)}</Badge>
                  </div>
                  <p className="text-sm text-text-muted">{s.description}</p>
                  {s.benefits.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-1.5" role="list">
                      {s.benefits.map((b) => (
                        <li key={b}>
                          <Badge tone="success">{b}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 font-semibold text-brand">
                    {formatCurrency(s.price, brand.locale, brand.currency)}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
