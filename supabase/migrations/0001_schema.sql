-- Agenda schema. Multi-tenant by default: each row carries tenant_id and RLS
-- scopes it to the signed-in admin's tenant. For a single-client instance you
-- can keep one tenant row ("default") and ignore the rest.

create extension if not exists pgcrypto;

create table if not exists tenants (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'admin',
  primary key (tenant_id, user_id)
);

create table if not exists services (
  tenant_id       uuid not null references tenants(id) on delete cascade,
  id              text not null,
  name            text not null,
  summary         text,
  description     text,
  benefits        text[] not null default '{}',
  duration_minutes int not null default 60,
  price           numeric not null default 0,
  image_url       text,
  image_alt       text,
  image_width     int,
  image_height    int,
  primary key (tenant_id, id)
);

do $$ begin
  create type booking_status as enum ('confirmed', 'cancelled', 'attended');
exception when duplicate_object then null; end $$;

create table if not exists bookings (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  code          text not null,
  date          date not null,
  time          text not null,            -- "HH:MM", slot start
  service_id    text not null,
  patient_name  text not null,
  patient_phone text not null,            -- E.164
  status        booking_status not null default 'confirmed',
  created_at    timestamptz not null default now(),
  cancelled_at  timestamptz,
  unique (tenant_id, code)
);

-- THE invariant, enforced by Postgres: at most one ACTIVE booking per slot.
-- A race that slips past the app-level check still fails here.
create unique index if not exists bookings_one_active_per_slot
  on bookings (tenant_id, date, time)
  where status in ('confirmed', 'attended');

create table if not exists blocks (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  date       date not null,
  time       text not null,
  reason     text,
  created_at timestamptz not null default now(),
  unique (tenant_id, date, time)
);

create index if not exists bookings_tenant_date on bookings (tenant_id, date);
create index if not exists blocks_tenant_date on blocks (tenant_id, date);
