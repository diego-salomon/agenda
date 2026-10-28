import { AgendaService, systemClock, bookingCodeGenerator } from '@/application';
import { brand } from '@/config/brand.config';
import { agenda } from '@/config/agenda.config';
import { LocalStorageAgendaRepository } from '@/infrastructure/localStorage/localStorageAgendaRepository';
import { DemoNotificationGateway } from '@/infrastructure/notifications/demoNotificationGateway';
import { getSupabaseClient } from '@/infrastructure/supabase/supabaseClient';
import { SupabaseAgendaRepository } from '@/infrastructure/supabase/supabaseAgendaRepository';
import { SupabaseNotificationGateway } from '@/infrastructure/notifications/supabaseNotificationGateway';

export type RunMode = 'demo' | 'live';

export interface App {
  service: AgendaService;
  mode: RunMode;
  /** Live admin sign-in (Supabase Auth). Undefined in demo mode. */
  signIn?: (email: string, password: string) => Promise<void>;
}

export function resolveMode(): RunMode {
  return import.meta.env.VITE_MODE === 'live' ? 'live' : 'demo';
}

/**
 * Composition root — the ONLY place that knows which adapters are in play.
 * Everything above consumes the AgendaService and is identical in both modes.
 */
export function buildApp(): App {
  const mode = resolveMode();
  const shared = {
    clock: systemClock,
    codes: bookingCodeGenerator,
    brand,
    agenda,
    demoMode: mode === 'demo',
  };

  if (mode === 'live') {
    const client = getSupabaseClient();
    const repo = new SupabaseAgendaRepository(client, import.meta.env.VITE_TENANT_SLUG ?? 'default');
    const notifications = new SupabaseNotificationGateway(client);
    const signIn = async (email: string, password: string) => {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    };
    return { service: new AgendaService({ ...shared, repo, notifications }), mode, signIn };
  }

  const repo = new LocalStorageAgendaRepository(window.localStorage, systemClock);
  const notifications = new DemoNotificationGateway();
  return { service: new AgendaService({ ...shared, repo, notifications }), mode };
}
