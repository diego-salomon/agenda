import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Lazily build the Supabase client from env. Only called in live mode. */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Modo live: faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en el entorno.',
    );
  }
  client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
