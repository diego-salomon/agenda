import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DaySlot } from '@/application';
import { useApp } from '../AppContext';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { Alert, Badge, Card, buttonClasses } from '../components';
import { SlotGrid } from '../components/SlotGrid';
import { CheckIcon, MonitorIcon, DatabaseIcon, SlidersIcon } from '../components/Icon';

/**
 * Marketing page for the Agenda template itself (Persuade surface). It inherits
 * the product's own design system and shows the real SlotGrid so a visitor sees
 * the mechanism, not a mockup. "Agenda" here is the template; the surrounding
 * chrome and seed data are the example brand it ships with.
 */

// The public repo, shown as "Ver el código" once set.
const REPO_URL = 'https://github.com/diego-salomon/agenda';

// A static day used only for the hero preview — all four slot states on screen.
const PREVIEW_SLOTS: DaySlot[] = [
  { time: '08:00', status: 'past' },
  { time: '09:00', status: 'booked' },
  { time: '10:00', status: 'free' },
  { time: '11:00', status: 'free' },
  { time: '12:00', status: 'blocked' },
  { time: '14:00', status: 'free' },
  { time: '15:00', status: 'booked' },
  { time: '16:00', status: 'free' },
  { time: '17:00', status: 'free' },
];

export function LandingPage() {
  const { brand } = useApp();
  useDocumentHead(
    'La plantilla',
    'Agenda: plantilla de reservas lista para usar. Tus clientes reservan desde el teléfono y tú organizas la semana desde un panel.',
  );

  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      <Hero exampleName={brand.name} />
      <Problem />
      <HowItWorks />
      <TwoModes />
      <WhiteLabel exampleName={brand.name} />
      <Includes />
      <Scope />
      <FinalCta />
    </div>
  );
}

function Hero({ exampleName }: { exampleName: string }) {
  return (
    <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col items-start gap-5">
        <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">
          Tu negocio tomando reservas online, hoy mismo.
        </h1>
        <p className="max-w-prose text-lg text-text-muted">
          Agenda es una plantilla de reservas lista para usar. Tus clientes reservan desde el
          teléfono en menos de un minuto y tú organizas la semana desde un panel. Pruébala ahora,
          sin instalar nada.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link className={buttonClasses('primary', 'lg')} to="/">
            Probar la demo
          </Link>
          <a className={buttonClasses('ghost', 'lg')} href="#como-funciona">
            Cómo funciona
          </a>
          {REPO_URL && (
            <a
              className={buttonClasses('ghost', 'lg')}
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver el código
            </a>
          )}
        </div>
        <p className="text-sm text-text-muted">Sin registro ni instalación.</p>
      </div>

      <HeroPreview exampleName={exampleName} />
    </section>
  );
}

function HeroPreview({ exampleName }: { exampleName: string }) {
  const [time, setTime] = useState<string | null>('11:00');
  return (
    <Card className="reveal flex flex-col gap-4 p-5 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Vista previa
          </span>
          <span className="font-semibold text-text first-letter:uppercase">lunes 12</span>
        </div>
        <Badge tone="brand">{exampleName}</Badge>
      </div>
      <SlotGrid slots={PREVIEW_SLOTS} selected={time} onPick={setTime} />
      <p className="text-sm text-text-muted">
        La misma grilla que ve tu cliente. Toca un horario libre para elegirlo.
      </p>
    </Card>
  );
}

function Problem() {
  return (
    <section className="flex max-w-prose flex-col gap-3">
      <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
        Coordinar turnos por mensajes cansa.
      </h2>
      <p className="text-lg text-text-muted">
        Horarios que se pisan, llamadas para confirmar, un cliente que escribe a medianoche y se
        queda sin respuesta. Agenda junta todo eso en una pantalla que atiende por ti.
      </p>
    </section>
  );
}

const CLIENT_STEPS = [
  'Elige servicio, día y hora libre.',
  'Deja su nombre y teléfono.',
  'Guarda un código para consultar o cancelar.',
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="flex scroll-mt-24 flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Cómo funciona</h2>
        <p className="text-text-muted">El cliente reserva en tres pasos. Tú manejas el resto.</p>
      </div>

      <ol className="grid gap-5 sm:grid-cols-3" role="list">
        {CLIENT_STEPS.map((step, i) => (
          <li key={step} className="flex flex-col gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-base font-semibold text-brand-contrast">
              {i + 1}
            </span>
            <p className="text-text">{step}</p>
          </li>
        ))}
      </ol>

      <Card className="flex flex-col gap-2 bg-surface-2 p-5">
        <h3 className="font-semibold text-text">Del lado del negocio</h3>
        <p className="text-text-muted">
          Ves el día completo, cancelas, mueves un turno, lo marcas como atendido o bloqueas un
          hueco. Todo desde el mismo panel, en el teléfono o en el escritorio.
        </p>
      </Card>
    </section>
  );
}

function TwoModes() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Una base de código, dos formas de correr.
        </h2>
        <p className="max-w-prose text-text-muted">
          El mismo código funciona para mostrar y para producción. Cambias una variable de entorno
          y el resto queda igual.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="flex flex-col gap-3 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 text-text">
            <MonitorIcon size={24} />
          </span>
          <h3 className="text-lg font-semibold text-text">Demo</h3>
          <p className="text-text-muted">
            Todo en el navegador, con datos de ejemplo y sin backend. Es lo que estás viendo ahora:
            ideal para mostrar en una reunión o dejar en tu portafolio.
          </p>
        </Card>

        <Card className="flex flex-col gap-3 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 text-text">
            <DatabaseIcon size={24} />
          </span>
          <h3 className="text-lg font-semibold text-text">Producción</h3>
          <p className="text-text-muted">
            Un backend real (Supabase) detrás del mismo puerto de datos. Las reservas se guardan de
            verdad y el panel usa cuentas con contraseña.
          </p>
        </Card>
      </div>
    </section>
  );
}

function WhiteLabel({ exampleName }: { exampleName: string }) {
  return (
    <section className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 text-text">
          <SlidersIcon size={24} />
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Tuya en dos archivos.
        </h2>
        <p className="max-w-prose text-text-muted">
          El nombre, los colores, los servicios, los horarios y los textos viven en dos archivos de
          configuración. Lo que ves arriba es {exampleName}, una marca de ejemplo. Sirve para
          terapia, fisio, peluquería, coaching o cualquier negocio con cita previa, porque nada del
          rubro está escrito en el código.
        </p>
      </div>

      <Card className="flex flex-col gap-3 p-6">
        <ConfigRow file="brand.config.ts" desc="Nombre, logo, colores, contacto e idioma." />
        <ConfigRow file="agenda.config.ts" desc="Servicios, precios, horarios y notificaciones." />
      </Card>
    </section>
  );
}

function ConfigRow({ file, desc }: { file: string; desc: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-surface-2 p-4">
      <code className="font-mono text-sm font-semibold text-brand">{file}</code>
      <span className="text-sm text-text-muted">{desc}</span>
    </div>
  );
}

const FEATURES = [
  'Un turno por hueco, garantizado de principio a fin. Un servicio largo ocupa todos los huecos que dura.',
  'Cancelar cambia el estado del turno y conserva el historial.',
  'Notificaciones de confirmación, recordatorio y cancelación.',
  'Resumen de la reserva por WhatsApp con un toque.',
  'Accesible: WCAG AA, se ve bien desde 375 px, foco de teclado visible y respeta reduce-motion.',
  'Probada: 57 pruebas unitarias y 6 de extremo a extremo.',
];

function Includes() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Lo que incluye</h2>
      <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2" role="list">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckIcon size={16} />
            </span>
            <span className="text-text">{f}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Scope() {
  return (
    <section className="max-w-prose">
      <Alert tone="info" title="Qué incluye y qué no">
        No maneja pagos ni correo. En la demo, las notificaciones y el acceso al panel aparecen
        marcados como simulados. La conexión con Supabase está lista en el código y todavía sin
        enlazar a un proyecto real.
      </Alert>
    </section>
  );
}

function FinalCta(): ReactNode {
  return (
    <section className="flex flex-col items-center gap-4 rounded-lg border border-border bg-brand/5 p-8 text-center sm:p-12">
      <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
        Pruébala tú mismo.
      </h2>
      <p className="max-w-prose text-text-muted">
        Reserva un turno, míralo aparecer en el panel y cancélalo. Es la demo completa, sin registro
        ni instalación.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link className={buttonClasses('primary', 'lg')} to="/">
          Probar la demo
        </Link>
        {REPO_URL && (
          <a
            className={buttonClasses('ghost', 'lg')}
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver el código en GitHub
          </a>
        )}
      </div>
    </section>
  );
}
