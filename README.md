# Agenda

White-label appointment-booking web app. Patients book a session from their
phone against a live availability grid; the business runs the week from an admin
panel. The **same code** runs two ways, chosen by one env var:

- **demo** (default) — everything in the browser on `localStorage`, seeded with
  example data. For sales demos and portfolio.
- **live** — a real Supabase backend (Postgres + Auth + RLS).

```bash
pnpm install
pnpm dev          # demo mode, http://localhost:5173
pnpm test         # unit tests (domain + application + infra)
pnpm test:e2e     # Playwright, desktop + mobile
pnpm build        # typecheck + production build
```

## Why the backend is a drop-in

The code is layered so the backend sits behind a single port:

```
src/domain/         pure business rules, no I/O, unit-tested
src/application/     use cases over the AgendaRepository port (the backend seam)
src/infrastructure/  adapters: localStorage (demo) · Supabase (live) · notifications
src/ui/              React screens — identical in both modes
src/app/container.ts the ONLY place that picks adapters, by VITE_MODE
```

Nothing above `src/infrastructure` knows where data lives. Switching modes swaps
adapters in `container.ts` and changes nothing else.

## Two files to white-label

Everything client-specific lives in exactly two files — no brand strings in
components, all currency/date formatting from locale + currency:

- [`src/config/brand.config.ts`](src/config/brand.config.ts) — name, tagline,
  logo, palette (light + dark), locale, currency, contact, socials, phone rules.
- [`src/config/agenda.config.ts`](src/config/agenda.config.ts) — services
  catalog, opening hours, notification copy.

To rebrand: edit those two files (and the palette). `pnpm dev` then shows a full
working demo on localStorage.

## Screens

| Route | What |
|-------|------|
| `/` | Book: service → day → free time → details → **Confirmar turno** (code + WhatsApp deep link) |
| `/agenda` | Public weekly free/busy grid, read-only |
| `/mi-turno` | Look up / cancel by booking code |
| `/admin` | Admin: cancel, move, mark attended, block/free slots, reset demo (demo: client-side gate labelled *not real security*; live: Supabase Auth) |
| `/centro` | Business info: services, hours, address, Maps link, socials — all from config |

## Domain model

`Service`, `BusinessHours` (per-weekday tramos + uniform slot grid), `Booking`
(code, date, time, serviceId, patient, status, timestamps), `Block` (staff hold),
and the aggregate root **`DayAggregate`** — the whole day is the load/save unit,
so the invariant **one active booking per slot** is always checked against the
complete picture. Cancelling flips the status; it never deletes. Value objects:
`AgendaDate`, `TimeSlot`, `PhoneNumber` (rules from the brand locale, not
country-hardcoded), `PatientName`, `BookingCode`.

**Note on the status enum:** the brief lists `blocked` among booking statuses;
here a block is modelled as a separate `Block` entity (the repository exposes
`blocksBetween`), so `BookingStatus` is `confirmed | cancelled | attended`. This
keeps the one-booking-per-slot invariant reasoning only about patients.

**Note on async:** `AgendaRepository` returns Promises (the brief sketches it
sync). A network backend can't be wrapped synchronously; async makes the
Supabase adapter a genuine drop-in and the localStorage adapter just resolves
immediately.

## Notifications

Confirmation (on book), reminder (24h before), cancellation — copy templated in
`agenda.config.ts`. **Demo:** rendered on screen, labelled *simulado*, nothing
sent. **Live:** the `notify` Supabase Edge Function fans out to an SMS/WhatsApp
provider behind a stubbed adapter. No email, no payments.

## Live backend (Supabase)

See [`supabase/README.md`](supabase/README.md). Tables `services`, `bookings`,
`blocks` with `tenant_id` + RLS (multi-tenant via `tenants`/`memberships`; keep
one tenant for a single-client instance). Public booking goes through the
security-definer `create_booking` RPC, which re-checks availability server-side;
a partial unique index is the final guard against races. Public availability is
served by the `availability` RPC (busy times only, never patient data).

```bash
# .env for live mode
VITE_MODE=live
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_TENANT_SLUG=default
```

The Supabase path is wired against this schema but has **not** been run against
a live project in this build — the demo path is the verified one.

## Design system & accessibility

In-repo CSS-variable tokens (color, radius, spacing) in
[`src/index.css`](src/index.css), light + dark (OS preference + manual toggle),
mobile-first, WCAG AA contrast, reduced-motion honored, nothing clipped at
375px. Brand hues are injected at runtime from the palette.

## SEO & prerender

Public pages set per-route `<title>`/description (`useDocumentHead`) and ship a
strict Content-Security-Policy meta in `index.html`. For true static prerender
of the public pages (`/`, `/agenda`, `/centro`), add a prerender step (e.g.
`vite-plugin-prerender` or `@prerenderer`) over the built SPA — the head
management and semantic markup are already in place for it.

## Quality bar

`pnpm build && pnpm test && pnpm test:e2e` all green. Unit tests cover the domain
(value objects, `DayAggregate` invariant) and application use cases; Playwright
covers book → slot busy → cancel → frees up → double-book blocked, on desktop
and mobile.

## Clean-room

Built generically from the two reference apps' structure. No client names,
branding or data from them; no demo passwords; no vendor error hooks; no
country-specific phone hardcoding — all of that is driven by the two config files.
