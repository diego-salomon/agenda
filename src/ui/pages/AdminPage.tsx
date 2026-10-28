import { useState } from 'react';
import { AgendaDate, TimeSlot } from '@/domain';
import { useApp } from '../AppContext';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useAsyncData } from '../hooks/useAsyncData';
import { todayISO } from '../lib/days';
import { Alert, Badge, Button, Card, Field, Spinner } from '../components';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icon';
import { formatLongDate } from '@/lib/format';

const SESSION_KEY = 'agenda.admin.unlocked';

export function AdminPage() {
  const { mode } = useApp();
  useDocumentHead('Administración', 'Panel de gestión de la agenda.');

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (mode !== 'demo') return false; // live always re-authenticates with Supabase
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });

  function unlock(persist: boolean) {
    if (persist) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // ignore
      }
    }
    setUnlocked(true);
  }

  if (!unlocked) {
    return mode === 'live' ? (
      <LiveGate onUnlock={() => unlock(false)} />
    ) : (
      <DemoGate onUnlock={() => unlock(true)} />
    );
  }
  return <AdminPanel />;
}

function DemoGate({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-bold text-text">Administración</h1>
      <Alert tone="warning" title="No es seguridad real">
        Esta es una entrada de demostración, sin autenticación. En modo live el acceso usa Supabase
        Auth.
      </Alert>
      <Button onClick={onUnlock}>Entrar al panel (demo)</Button>
    </div>
  );
}

function LiveGate({ onUnlock }: { onUnlock: () => void }) {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!signIn) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      onUnlock();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-bold text-text">Administración</h1>
      <Card className="p-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner label="Entrando…" /> : 'Iniciar sesión'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function AdminPanel() {
  const { service, brand, agenda, mode } = useApp();
  const [dateISO, setDateISO] = useState(() => todayISO());
  const view = useAsyncData(() => service.loadDayView(dateISO), [dateISO]);
  const reminders = useAsyncData(() => service.dueReminders(), []);

  const [working, setWorking] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<void>) {
    setWorking(key);
    setActionError(null);
    try {
      await action();
      view.reload();
      reminders.reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo completar la acción.');
    } finally {
      setWorking(null);
    }
  }

  function shiftDay(days: number) {
    setDateISO(AgendaDate.create(dateISO).addDays(days).toISO());
  }

  const freeTimes = view.data?.slots.filter((s) => s.status === 'free').map((s) => s.time) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Administración</h1>
        {mode === 'demo' && (
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm('¿Restablecer los datos de demostración?')) {
                void run('reset', () => service.resetDemo());
              }
            }}
            disabled={working === 'reset'}
          >
            Restablecer demo
          </Button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => shiftDay(-1)} aria-label="Día anterior">
          <ChevronLeftIcon size={18} />
        </Button>
        <input
          type="date"
          value={dateISO}
          onChange={(e) => e.target.value && setDateISO(e.target.value)}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-text"
          aria-label="Fecha"
        />
        <Button variant="secondary" onClick={() => shiftDay(1)} aria-label="Día siguiente">
          <ChevronRightIcon size={18} />
        </Button>
        <p className="text-sm first-letter:uppercase text-text-muted">
          {formatLongDate(dateISO, brand.locale)}
        </p>
      </div>

      {actionError && <Alert tone="danger">{actionError}</Alert>}
      {view.loading && <Spinner />}
      {view.error && <Alert tone="danger">{view.error}</Alert>}

      {view.data && (
        <Card className="divide-y divide-border">
          {view.data.slots.length === 0 && (
            <p className="p-4 text-sm text-text-muted">Cerrado este día.</p>
          )}
          {view.data.slots.map((slot) => {
            const booking = view.data!.day.activeBookingAt(TimeSlot.create(slot.time));
            const block = view.data!.day.blockAt(TimeSlot.create(slot.time));
            return (
              <div key={slot.time} className="flex flex-wrap items-center gap-3 p-3">
                <span className="w-14 font-semibold tabular-nums text-text">{slot.time}</span>

                {booking ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text">{booking.patient.name}</p>
                      <p className="truncate text-sm text-text-muted">
                        {booking.patient.phone} · {service.findService(booking.serviceId)?.name} ·{' '}
                        {booking.code}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void run(`att-${slot.time}`, () =>
                            service.adminMarkAttended(dateISO, booking.code),
                          )
                        }
                      >
                        Atendido
                      </Button>
                      {freeTimes.length > 0 && (
                        <MoveControl
                          freeTimes={freeTimes}
                          busy={working === `mv-${slot.time}`}
                          onMove={(to) =>
                            void run(`mv-${slot.time}`, () => service.adminMove(booking.code, to))
                          }
                        />
                      )}
                      <Button
                        variant="danger"
                        onClick={() =>
                          void run(`cancel-${slot.time}`, () => service.adminCancel(booking.code))
                        }
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : block ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <Badge tone="warning">Bloqueado</Badge>{' '}
                      <span className="text-sm text-text-muted">{block.reason ?? 'Sin motivo'}</span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void run(`free-${slot.time}`, () => service.adminFree(dateISO, slot.time))
                      }
                    >
                      Liberar
                    </Button>
                  </>
                ) : slot.status === 'booked' ? (
                  <span className="flex-1 text-sm text-text-muted">Ocupado (en curso)</span>
                ) : slot.status === 'past' ? (
                  <span className="flex-1 text-sm text-text-muted">Pasado</span>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-text-muted">Libre</span>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        void run(`block-${slot.time}`, () =>
                          service.adminBlock(dateISO, slot.time, 'Bloqueado por el equipo'),
                        )
                      }
                    >
                      Bloquear
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </Card>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">
          Recordatorios (próximas {agenda.reminderLeadHours}&nbsp;h)
        </h2>
        {reminders.loading && <Spinner />}
        {reminders.data && reminders.data.length === 0 && (
          <p className="text-sm text-text-muted">No hay turnos en las próximas horas.</p>
        )}
        {reminders.data && reminders.data.length > 0 && (
          <ul className="flex flex-col gap-2" role="list">
            {reminders.data.map((m, i) => (
              <li key={i}>
                <Card className="p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-text-muted">{m.to}</span>
                    {m.simulated && <Badge tone="warning">simulado</Badge>}
                  </div>
                  <p className="text-text">{m.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MoveControl({
  freeTimes,
  busy,
  onMove,
}: {
  freeTimes: string[];
  busy: boolean;
  onMove: (to: string) => void;
}) {
  const [to, setTo] = useState('');
  return (
    <span className="inline-flex items-center gap-1">
      <select
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="min-h-11 rounded-md border border-border bg-surface px-2 text-text"
        aria-label="Nueva hora"
      >
        <option value="">Mover a…</option>
        {freeTimes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <Button variant="secondary" disabled={!to || busy} onClick={() => to && onMove(to)}>
        Mover
      </Button>
    </span>
  );
}
