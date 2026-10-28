import { AgendaService, systemClock, bookingCodeGenerator } from '@/application';
import { brand } from '@/config/brand.config';
import { agenda } from '@/config/agenda.config';
import { LocalStorageAgendaRepository } from '@/infrastructure/localStorage/localStorageAgendaRepository';
import { DemoNotificationGateway } from '@/infrastructure/notifications/demoNotificationGateway';
import { getSupabaseClient } from '@/infrastructure/supabase/supabaseClient';
import { SupabaseAgendaRepository } from '@/infrastructure/supabase/supabaseAgendaRepository';
import { SupabaseNotificationGateway } from '@/infrastructure/notifications/supabaseNotificationGateway';

export type RunMode = 'demo' | 'live';

export function resolveMode(): RunMode {
  return import.meta.env.VITE_MODE === 'live' ? 'live' : 'demo';
}

/**
 * Composition root. This is the ONLY place that knows which adapters are in
 * play. Everything above consumes the AgendaService and is identical in both
 * modes — that is what makes the backend a drop-in. Importing the Supabase
 * modules is side-effect-free; the client is built only when mode === 'live'.
 */
export function buildAgendaService(): { service: AgendaService; mode: RunMode } {
  const mode = resolveMode();

  if (mode === 'live') {
    const client = getSupabaseClient();
    const repo = new SupabaseAgendaRepository(client, import.meta.env.VITE_TENANT_SLUG ?? 'default');
    const notifications = new SupabaseNotificationGateway(client);
    return {
      service: new AgendaService({
        repo,
        clock: systemClock,
        codes: bookingCodeGenerator,
        notifications,
        brand,
        agenda,
      }),
      mode,
    };
  }

  const repo = new LocalStorageAgendaRepository(window.localStorage, systemClock);
  const notifications = new DemoNotificationGateway();
  return {
    service: new AgendaService({
      repo,
      clock: systemClock,
      codes: bookingCodeGenerator,
      notifications,
      brand,
      agenda,
    }),
    mode,
  };
}
