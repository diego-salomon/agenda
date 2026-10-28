import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Booking, Service } from '@/domain';
import { occupiesSlot } from '@/domain';
import type { NotificationMessage } from '@/application';
import { useApp } from '../AppContext';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { Alert, Badge, Button, Card, Field, Spinner } from '../components';
import { formatLongDate } from '@/lib/format';
import type { BadgeTone } from '../components';

const STATUS: Record<Booking['status'], { label: string; tone: BadgeTone }> = {
  confirmed: { label: 'Confirmado', tone: 'success' },
  attended: { label: 'Atendido', tone: 'brand' },
  cancelled: { label: 'Cancelado', tone: 'danger' },
};

export function MyBookingPage() {
  const { service, brand } = useApp();
  useDocumentHead('Mi turno', 'Consulta o cancela tu turno con tu código.');

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<{ booking: Booking; svc: Service | null } | null>(null);
  const [searched, setSearched] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<NotificationMessage | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    setCancelMsg(null);
    setSearched(true);
    try {
      const result = await service.lookup(code);
      setFound(result ? { booking: result.booking, svc: result.service } : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo buscar el turno.');
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    if (!found) return;
    setLoading(true);
    setError(null);
    try {
      const { booking, notification } = await service.cancel(found.booking.code);
      setFound({ booking, svc: found.svc });
      setCancelMsg(notification);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Mi turno</h1>
        <p className="text-text-muted">Ingresa el código que recibiste al reservar.</p>
      </header>

      <Card className="flex flex-col gap-4 p-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <Field
            label="Código de reserva"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC234"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={6}
            name="code"
          />
          <Button type="submit" disabled={loading || code.trim().length === 0}>
            {loading ? <Spinner label="Buscando…" /> : 'Buscar'}
          </Button>
        </form>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}

      {searched && !loading && !found && !error && (
        <Alert tone="warning">
          No encontramos un turno con ese código. Revísalo e intenta de nuevo.
        </Alert>
      )}

      {found && (
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-text">{found.svc?.name ?? 'Turno'}</h2>
            <Badge tone={STATUS[found.booking.status].tone}>
              {STATUS[found.booking.status].label}
            </Badge>
          </div>
          <dl className="grid gap-1 text-sm text-text-muted">
            <div className="flex justify-between gap-4">
              <dt>Código</dt>
              <dd className="font-semibold tracking-wide text-text">{found.booking.code}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Fecha</dt>
              <dd className="font-medium first-letter:uppercase text-text">
                {formatLongDate(found.booking.date, brand.locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Hora</dt>
              <dd className="font-medium text-text">{found.booking.time} h</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>A nombre de</dt>
              <dd className="font-medium text-text">{found.booking.patient.name}</dd>
            </div>
          </dl>

          {occupiesSlot(found.booking.status) ? (
            <Button variant="danger" onClick={cancel} disabled={loading}>
              {loading ? <Spinner label="Cancelando…" /> : 'Cancelar turno'}
            </Button>
          ) : (
            <Alert tone="info">Este turno ya no está activo.</Alert>
          )}
        </Card>
      )}

      {cancelMsg && (
        <Alert tone="success" title="Turno cancelado">
          <p>El horario quedó libre de nuevo.</p>
          <p className="mt-2 rounded bg-surface-2 p-2 text-sm text-text">{cancelMsg.body}</p>
          <p className="mt-2">
            <Link to="/" className="font-medium text-brand hover:underline">
              Reservar otro turno
            </Link>
          </p>
        </Alert>
      )}
    </div>
  );
}
