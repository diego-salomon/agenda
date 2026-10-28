# Supabase backend (live mode)

This folder holds everything the live backend needs. It is **wired against the
app's Supabase adapter but has not been executed against a real project in this
build** — the demo (localStorage) path is the one verified here. Applying it is
the one remaining step to run the app on a real backend.

## Layout

- `migrations/0001_schema.sql` — tables (`tenants`, `memberships`, `services`,
  `bookings`, `blocks`), the `booking_status` enum, and the **partial unique
  index** that enforces one active booking per slot at the database level.
- `migrations/0002_rls_and_rpc.sql` — RLS policies plus two security-definer
  RPCs: `availability(slug, date)` (public, busy times only — never patient
  data) and `create_booking(...)` (public, re-checks availability server-side).
- `seed.sql` — a `default` tenant and the demo service catalog.
- `functions/notify/` — the Edge Function that fans notifications out to an
  SMS/WhatsApp provider. The provider call is a stub; wire your own in `deliver()`.

## Apply it

```bash
supabase start                      # or link an existing project
supabase db push                    # runs migrations/*.sql
psql "$DATABASE_URL" -f supabase/seed.sql
supabase functions deploy notify
```

## Point the app at it

Set in `.env`:

```
VITE_MODE=live
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_TENANT_SLUG=default
```

`pnpm dev` now runs the exact same app against Postgres instead of localStorage.

## Multi-tenant vs single-client

Every table carries `tenant_id` and RLS scopes writes to the signed-in admin's
tenant (via `memberships`). For one instance per client, keep a single tenant
row and set `VITE_TENANT_SLUG` to its slug — the extra machinery stays inert.

## Known gaps & caveats (live path, unverified)

- **Public cancel by code.** The `cancel_booking` RPC exists, but the generic
  `AgendaRepository` port (load/save a whole day) can't express an anonymous
  cancel, since an anonymous visitor can't load the real day. Admin cancel works
  under RLS. Wiring `/mi-turno` cancel to `cancel_booking` is the remaining step.
- **Timezone.** Slot times and the `create_booking` past-check use the browser /
  server local time, not a configured business timezone. Fine when they match;
  add a tenant timezone column + conversions otherwise.
- **Catalog source of truth.** The app reads the services catalog from
  `agenda.config.ts`; the `services` table + `seed.sql` exist for the schema the
  spec asks for. Keep them in sync, or point the UI at the table.

## Admin auth

Admin screens use Supabase Auth in live mode. Create the admin user in the
Supabase dashboard and insert a `memberships` row linking that `user_id` to the
tenant. The demo-mode password gate is **not** real security and is never used
in live mode.
