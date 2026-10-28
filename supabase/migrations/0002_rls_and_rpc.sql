-- Row-level security and the public RPCs.

alter table tenants     enable row level security;
alter table memberships enable row level security;
alter table services    enable row level security;
alter table bookings    enable row level security;
alter table blocks      enable row level security;

-- Is the current user an admin of this tenant?
create or replace function is_member(t uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.tenant_id = t and m.user_id = auth.uid()
  );
$$;

-- tenants: public may resolve slug -> id/name; writes are out of band.
drop policy if exists tenants_read on tenants;
create policy tenants_read on tenants for select using (true);

-- memberships: a user sees only their own.
drop policy if exists memberships_self on memberships;
create policy memberships_self on memberships for select using (user_id = auth.uid());

-- services: public read (the /centro page), admin write.
drop policy if exists services_read on services;
create policy services_read on services for select using (true);
drop policy if exists services_write on services;
create policy services_write on services for all
  using (is_member(tenant_id)) with check (is_member(tenant_id));

-- bookings: admin-only (patient data). The public never selects bookings;
-- availability is exposed through the availability() RPC below.
drop policy if exists bookings_admin_all on bookings;
create policy bookings_admin_all on bookings for all
  using (is_member(tenant_id)) with check (is_member(tenant_id));

-- blocks: public read (they affect availability), admin write.
drop policy if exists blocks_read on blocks;
create policy blocks_read on blocks for select using (true);
drop policy if exists blocks_admin_write on blocks;
create policy blocks_admin_write on blocks for all
  using (is_member(tenant_id)) with check (is_member(tenant_id));

-- Public availability: returns only busy times, never patient data.
create or replace function availability(p_slug text, p_date date)
returns table (time text, status text)
language sql security definer stable set search_path = public as $$
  with t as (select id from tenants where slug = p_slug)
  select b.time, 'booked'::text
    from bookings b join t on b.tenant_id = t.id
    where b.date = p_date and b.status in ('confirmed', 'attended')
  union all
  select bl.time, 'blocked'::text
    from blocks bl join t on bl.tenant_id = t.id
    where bl.date = p_date;
$$;
grant execute on function availability(text, date) to anon, authenticated;

-- Public booking creation with a server-side availability re-check. The partial
-- unique index is the ultimate guard; this gives a friendlier error first.
create or replace function create_booking(
  p_slug       text,
  p_code       text,
  p_service_id text,
  p_date       date,
  p_time       text,
  p_name       text,
  p_phone      text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid;
begin
  select id into v_tenant from tenants where slug = p_slug;
  if v_tenant is null then
    raise exception 'TENANT_NOT_FOUND';
  end if;

  if exists (
    select 1 from bookings
    where tenant_id = v_tenant and date = p_date and time = p_time
      and status in ('confirmed', 'attended')
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  if exists (
    select 1 from blocks
    where tenant_id = v_tenant and date = p_date and time = p_time
  ) then
    raise exception 'SLOT_BLOCKED';
  end if;

  insert into bookings (tenant_id, code, date, time, service_id, patient_name, patient_phone, status)
  values (v_tenant, p_code, p_date, p_time, p_service_id, p_name, p_phone, 'confirmed');

  return p_code;
end;
$$;
grant execute on function create_booking(text, text, text, date, text, text, text) to anon, authenticated;
