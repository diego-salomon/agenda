/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MODE?: 'demo' | 'live';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_TENANT_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
