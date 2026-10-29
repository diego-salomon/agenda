import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/', label: 'Reservar', end: true },
  { to: '/agenda', label: 'Agenda' },
  { to: '/mi-turno', label: 'Mi turno' },
  { to: '/centro', label: 'El centro' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { brand, mode } = useApp();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-contrast"
      >
        Saltar al contenido
      </a>

      {mode === 'demo' && (
        <div className="bg-brand/10 px-4 py-1.5 text-center text-xs text-text-muted">
          Modo demo · datos de ejemplo guardados en tu navegador
        </div>
      )}

      <header className="site-chrome sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
          <Link to="/" className="flex items-center gap-2 text-text" aria-label={brand.name}>
            <img src={brand.logoUrl} alt="" width={28} height={28} className="h-7 w-auto shrink-0" />
            <span className="font-bold">{brand.name}</span>
          </Link>
          <nav
            className="no-scrollbar -mx-1 flex items-center gap-0.5 overflow-x-auto px-1 sm:mx-0 sm:ml-auto sm:overflow-visible sm:px-0"
            aria-label="Principal"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-sm font-medium hover:bg-surface-2',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    isActive ? 'text-brand' : 'text-text-muted',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/centro" className="hover:text-text">
              {brand.contact.phoneDisplay}
            </Link>
            <Link to="/plantilla" className="hover:text-text">
              La plantilla
            </Link>
            <Link to="/admin" className="hover:text-text">
              Administración
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
