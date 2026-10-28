import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AgendaDate, PatientName, PhoneNumber, type Service } from '@/domain';
import type { BookResult } from '@/application';
import { useApp } from '../AppContext';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useAsyncData } from '../hooks/useAsyncData';
import { upcomingDates } from '../lib/days';
import { Alert, Badge, Button, Card, Field, Spinner, buttonClasses } from '../components';
import { SlotGrid } from '../components/SlotGrid';
import {
  formatCurrency,
  formatDuration,
  formatLongDate,
  formatWeekdayShort,
  whatsappLink,
} from '@/lib/format';
import { cn } from '@/lib/cn';

export function BookPage() {
  const { service: agendaService, brand } = useApp();
  useDocumentHead('Reservar un turno', brand.tagline);

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BookResult | null>(null);

  const services = agendaService.servicesCatalog();
  const hours = agendaService.businessHours();
  const service = serviceId ? services.find((s) => s.id === serviceId) ?? null : null;

  const openDays = useMemo(
    () => upcomingDates(28).filter((iso) => hours.isOpenOn(AgendaDate.create(iso))).slice(0, 14),
    [hours],
  );

  const day = useAsyncData(
    () => (dateISO ? agendaService.daySlots(dateISO) : Promise.resolve(null)),
    [dateISO],
  );

  const nameError = touched ? PatientName.validate(name) : null;
  const phoneError = touched ? PhoneNumber.validate(phone, brand.phoneRules) : null;

  function pickService(id: string) {
    setServiceId(id);
    setDateISO(null);
    setTime(null);
  }

  function pickDate(iso: string) {
    setDateISO(iso);
    setTime(null);
  }

  async function confirm() {
    setTouched(true);
    if (!service || !dateISO || !time) return;
    if (PatientName.validate(name) || PhoneNumber.validate(phone, brand.phoneRules)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const booked = await agendaService.book({ serviceId: service.id, dateISO, time, name, phone });
      setResult(booked);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo completar la reserva.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setServiceId(null);
    setDateISO(null);
    setTime(null);
    setName('');
    setPhone('');
    setTouched(false);
    setResult(null);
    setSubmitError(null);
  }

  if (result) {
    return <Confirmation result={result} onReset={reset} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Reserva tu turno</h1>
        <p className="text-text-muted">{brand.tagline}</p>
      </header>

      {/* Step 1: service */}
      <section aria-labelledby="step-service" className="flex flex-col gap-3">
        <StepTitle id="step-service" n={1} title="Elige un servicio" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {services.map((s) => (
            <li key={s.id}>
              <ServiceCard
                service={s}
                selected={serviceId === s.id}
                onSelect={() => pickService(s.id)}
                locale={brand.locale}
                currency={brand.currency}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Step 2: day */}
      {service && (
        <section aria-labelledby="step-day" className="flex flex-col gap-3">
          <StepTitle id="step-day" n={2} title="Elige el día" />
          <ul className="flex flex-wrap gap-2" role="list">
            {openDays.map((iso) => {
              const d = AgendaDate.create(iso);
              const active = dateISO === iso;
              return (
                <li key={iso}>
                  <button
                    type="button"
                    data-testid="day-chip"
                    onClick={() => pickDate(iso)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-h-16 w-16 flex-col items-center justify-center rounded-md border text-sm font-semibold [&>span]:first-letter:uppercase',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      active
                        ? 'border-brand bg-brand text-brand-contrast'
                        : 'border-border bg-surface text-text hover:border-brand',
                    )}
                  >
                    <span className="text-xs font-medium opacity-80">
                      {formatWeekdayShort(iso, brand.locale)}
                    </span>
                    <span className="text-lg">{d.day}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Step 3: time */}
      {service && dateISO && (
        <section aria-labelledby="step-time" className="flex flex-col gap-3">
          <StepTitle id="step-time" n={3} title="Elige la hora" />
          {day.loading && <Spinner />}
          {day.error && <Alert tone="danger">{day.error}</Alert>}
          {day.data && <SlotGrid slots={day.data.slots} selected={time} onPick={setTime} />}
          {day.data && day.data.slots.every((s) => s.status !== 'free') && (
            <Alert tone="info">No quedan horarios libres este día. Prueba con otra fecha.</Alert>
          )}
        </section>
      )}

      {/* Step 4: details */}
      {service && dateISO && time && (
        <section aria-labelledby="step-details" className="flex flex-col gap-4">
          <StepTitle id="step-details" n={4} title="Tus datos" />
          <Card className="flex flex-col gap-4 p-4">
            <p className="text-sm text-text-muted">
              {service.name} ·{' '}
              <span className="first-letter:uppercase">{formatLongDate(dateISO, brand.locale)}</span>{' '}
              ·{' '}
              {time} h
            </p>
            <Field
              label="Nombre y apellido"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              error={nameError}
              autoComplete="name"
              name="name"
            />
            <Field
              label="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouched(true)}
              error={phoneError}
              inputMode="tel"
              autoComplete="tel"
              name="phone"
              hint={`Ej.: ${brand.contact.phoneDisplay}`}
            />
            {submitError && <Alert tone="danger">{submitError}</Alert>}
            <Button size="lg" onClick={confirm} disabled={submitting}>
              {submitting ? <Spinner label="Confirmando…" /> : 'Confirmar turno'}
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}

function StepTitle({ id, n, title }: { id: string; n: number; title: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-lg font-semibold text-text">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-brand-contrast">
        {n}
      </span>
      {title}
    </h2>
  );
}

function ServiceCard({
  service,
  selected,
  onSelect,
  locale,
  currency,
}: {
  service: Service;
  selected: boolean;
  onSelect: () => void;
  locale: string;
  currency: string;
}) {
  return (
    <button
      type="button"
      data-testid="service-card"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-lg border bg-surface text-left transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected ? 'border-brand ring-2 ring-brand' : 'border-border hover:border-brand',
      )}
    >
      <img
        src={service.imageUrl}
        alt={service.imageAlt}
        width={service.imageWidth}
        height={service.imageHeight}
        className="aspect-[4/3] w-full object-cover"
        loading="lazy"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text">{service.name}</h3>
          <Badge tone="muted">{formatDuration(service.durationMinutes)}</Badge>
        </div>
        <p className="flex-1 text-sm text-text-muted">{service.summary}</p>
        <p className="font-semibold text-brand">{formatCurrency(service.price, locale, currency)}</p>
      </div>
    </button>
  );
}

function Confirmation({ result, onReset }: { result: BookResult; onReset: () => void }) {
  const { brand } = useApp();
  useDocumentHead('Turno confirmado', brand.tagline);
  const { booking, service, notification } = result;
  // Open WhatsApp to the business, pre-filled with the booking summary; the
  // patient taps send themselves — nothing is sent automatically.
  const wa = whatsappLink(brand.contact.whatsappE164, notification.body);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl text-success">
          ✓
        </span>
        <h1 className="text-2xl font-bold text-text">¡Turno confirmado!</h1>
        <p className="text-text-muted">Guarda tu código para consultar o cancelar.</p>
        <p
          data-testid="booking-code"
          className="rounded-md bg-surface-2 px-4 py-2 text-3xl font-bold tracking-widest text-text"
          aria-label={`Tu código es ${booking.code}`}
        >
          {booking.code}
        </p>
        <dl className="mt-2 grid w-full grid-cols-1 gap-1 text-sm text-text-muted">
          <div className="flex justify-between gap-4">
            <dt>Servicio</dt>
            <dd className="font-medium text-text">{service.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Fecha</dt>
            <dd className="font-medium first-letter:uppercase text-text">
              {formatLongDate(booking.date, brand.locale)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Hora</dt>
            <dd className="font-medium text-text">{booking.time} h</dd>
          </div>
        </dl>
      </Card>

      <a className={buttonClasses('primary', 'lg')} href={wa} target="_blank" rel="noopener noreferrer">
        Enviar resumen por WhatsApp
      </a>

      <Alert
        tone="info"
        title={notification.simulated ? 'Notificación simulada' : 'Mensaje de confirmación'}
      >
        {notification.simulated
          ? 'En modo demo no se envía nada. Este es el mensaje que recibiría el paciente:'
          : 'Le enviamos al paciente este mensaje:'}
        <p className="mt-2 rounded bg-surface-2 p-2 text-text">{notification.body}</p>
      </Alert>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onReset}>
          Reservar otro turno
        </Button>
        <Link className={buttonClasses('ghost')} to="/mi-turno">
          Ver mi turno
        </Link>
      </div>
    </div>
  );
}
