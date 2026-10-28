import { createContext, useContext, type ReactNode } from 'react';
import type { AgendaService } from '@/application';
import type { RunMode } from '@/app/container';
import { brand } from '@/config/brand.config';
import { agenda } from '@/config/agenda.config';

interface AppContextValue {
  service: AgendaService;
  mode: RunMode;
  brand: typeof brand;
  agenda: typeof agenda;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  service,
  mode,
  children,
}: {
  service: AgendaService;
  mode: RunMode;
  children: ReactNode;
}) {
  return (
    <AppContext.Provider value={{ service, mode, brand, agenda }}>{children}</AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>.');
  return ctx;
}
