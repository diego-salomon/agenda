# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary (optimize for this): the end patient/customer** booking a session from
  their phone against a live availability grid. Often in a hurry, one-handed, not
  signed in; success is "turno reservado" in under a minute with a code they keep.
- **Secondary: the business owner/staff** running the week from the admin panel
  (view the day, cancel, move, mark attended, block/free slots) on phone or desktop.
- **Operator audience: prospective clients and the person white-labeling it** — a
  small appointment-based business evaluating the template, and whoever rebrands it
  by editing the two config files. The zero-backend demo is the sales/portfolio pitch.

## Product Purpose

Agenda is a reusable **white-label appointment-booking app**: patients self-serve a
booking from a phone, and the business manages its week. It exists so a small
appointment-based business gets online booking without bespoke software, and so the
same build serves as a convincing no-backend sales/portfolio demo. Success = a
client is live by filling two config files, and a prospect can try a full working
demo with nothing to install.

## Positioning

One codebase runs **two ways behind a single repository port**: demo (everything in
the browser on localStorage, seeded) and live (a real Supabase backend), chosen by
one env var, with nothing else changing between modes. That makes it simultaneously a
zero-backend portfolio/sales demo and a real deployable product — a neighbor that
hardcodes one backend, or bolts a demo on as a separate mock, cannot truthfully copy
this. It is **vertical-agnostic** (therapy, physio, salon, coaching, clinic, any
by-appointment business); nothing about a trade is assumed in code — it all comes
from configuration.

## Operating Context

- Patient books on a phone, usually unauthenticated, picking service → day → free
  time → name/phone → confirm; keeps a short code to look up or cancel later.
- Business runs the week day-by-day in `/admin`; a public read-only weekly grid
  (`/agenda`) and a business-info page (`/centro`) are shown to visitors.
- Demo mode is presented in sales calls and as a portfolio piece with no backend and
  no sign-up; data is seeded fictional and resettable.
- Language is **neutral Latin-American Spanish**; dates and currency are derived from
  the brand's locale + currency, never hardcoded.
- Reference-only prior art (two Lovable-built apps) informed structure; none of their
  branding or data is present (clean-room).

## Capabilities and Constraints

- Screens: Book (`/`), public weekly Agenda (`/agenda`, read-only), Mi turno
  (`/mi-turno`, look up / cancel by code), Admin (`/admin`), Centro (`/centro`).
- **Core invariant: one active booking per slot**, defended end-to-end (whole-day
  aggregate + a Postgres partial unique index in live). Duration-aware: a longer
  service occupies every grid slot it spans. Cancelling flips status, never deletes.
- Notifications (confirmation / reminder 24h / cancellation) are templated copy. Demo
  renders them on screen marked *simulado*, sends nothing; live uses a Supabase Edge
  Function to an SMS/WhatsApp provider behind a stubbed adapter. **No email, no payments.**
- "Enviar resumen por WhatsApp" is a user-initiated `wa.me` deep link to the business
  — nothing is sent automatically.
- Admin: demo uses a client-side gate explicitly labelled **not real security**; live
  uses Supabase Auth. Multi-tenant capable (tenant_id + RLS) or single-client.
- Terminology (keep consistent): *turno* (booking), *hueco*/slot, *tramo* (opening
  window), *bloqueo* (staff-held slot).
- Known undecided/unverified: the live Supabase path is wired but not yet run against
  a real project; anonymous cancel-by-code in live still needs the `cancel_booking`
  RPC wired through the port; business-timezone handling and full static SEO prerender
  are deferred.

## Brand Commitments

- **White-label is the contract:** all client identity lives in exactly two files
  (`src/config/brand.config.ts`, `src/config/agenda.config.ts`). No client-specific
  strings in components; currency/date/phone formatting derive from locale, never a
  hardcoded country.
- **Neutral Latin-American Spanish** by default (never rioplatense/voseo).
- "Estudio Aurora" and all demo data (services, prices in PYG, the Asunción address,
  patient names) are **fictional placeholders, not a real brand** — future work must
  not treat them as a real client's identity or invent real-sounding ones.

## Evidence on Hand

- A working demo on localStorage with seeded fictional data; 57 unit tests (domain +
  application + infra) and 6 Playwright e2e (desktop + mobile).
- Supabase schema, RLS, RPCs and an Edge Function stub exist but are **unverified**
  against a live project.
- No real customers, testimonials, pricing, benchmarks, or deployments exist — do not
  fabricate them. The services, prices and contact details are demo placeholders.

## Product Principles

1. **One codebase, two modes.** Demo and live stay behavior-identical behind the
   repository port; never fork the UI per mode.
2. **White-label by config, never by code.** Two files hold all identity; no client
   string leaks into a component.
3. **The slot invariant is sacred.** One active booking per slot, defended end-to-end;
   cancelling never deletes history.
4. **Patient-first, phone-first.** The booking path is the primary surface and must be
   fast and legible on a small screen.
5. **Honest about scope.** Simulated notifications and the not-real-security gate are
   labelled as such; nothing pretends to be what it isn't.

## Accessibility & Inclusion

WCAG AA target, mobile-first with nothing clipped at 375px, visible keyboard focus and
logical order, `prefers-reduced-motion` honored, and neutral Latin-American Spanish so
copy reads naturally across the region.
