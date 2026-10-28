import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AgendaDate } from '@/domain';
import { useApp } from '../AppContext';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useAsyncData } from '../hooks/useAsyncData';
import { todayISO } from '../lib/days';
import { Alert, Badge, Button, Card, Spinner, buttonClasses } from '../components';
import { SlotGrid } from '../components/SlotGrid';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icon';
import { formatLongDate } from '@/lib/format';

export function AgendaPage() {
  const { service, brand } = useApp();
  useDocumentHead('Agenda de la semana', 'Disponibilidad semanal de turnos.');

  const [startISO, setStartISO] = useState(() =>
    AgendaDate.create(todayISO()).startOfWeek().toISO(),
  );

  const week = useAsyncData(() => service.weekAgenda(startISO), [startISO]);

  function shift(days: number) {
    setStartISO(AgendaDate.create(startISO).addDays(days).toISO());
  }

  const rangeLabel = week.data
    ? `${formatLongDate(week.data.days[0].dateISO, brand.locale)} – ${formatLongDate(
        week.data.days[6].dateISO,
        brand.locale,
      )}`
    : '';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Agenda de la semana</h1>
        <p className="text-text-muted">
          Disponibilidad de la semana. Para reservar, ve a{' '}
          <Link to="/" className="font-medium text-brand hover:underline">
            Reservar
          </Link>
          .
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => shift(-7)}>
          <ChevronLeftIcon size={18} /> Anterior
        </Button>
        <p className="text-center text-sm font-medium first-letter:uppercase text-text-muted">
          {rangeLabel}
        </p>
        <Button variant="secondary" onClick={() => shift(7)}>
          Siguiente <ChevronRightIcon size={18} />
        </Button>
      </div>

      {week.loading && <Spinner />}
      {week.error && <Alert tone="danger">{week.error}</Alert>}

      {week.data && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {week.data.days.map((d) => (
            <li key={d.dateISO}>
              <Card className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-semibold first-letter:uppercase text-text">
                    {formatLongDate(d.dateISO, brand.locale)}
                  </h2>
                  {d.open ? (
                    <Badge tone={d.freeCount > 0 ? 'success' : 'muted'}>
                      {d.freeCount > 0 ? `${d.freeCount} libres` : 'Completo'}
                    </Badge>
                  ) : (
                    <Badge tone="muted">Cerrado</Badge>
                  )}
                </div>
                <SlotGrid slots={d.slots} />
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Link to="/" className={buttonClasses('primary', 'lg')}>
          Reservar un turno
        </Link>
      </div>
    </div>
  );
}
