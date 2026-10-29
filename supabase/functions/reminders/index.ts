// Supabase Edge Function: reminders
//
// The scheduled job behind the confirmation-reminder feature — the server-side
// mirror of AgendaService.sendDueReminders. On each run it finds confirmed
// bookings whose start falls inside the reminder window and that haven't been
// reminded yet, asks the `notify` function to send each one, and stamps
// `reminded_at` so a later run never sends a duplicate.
//
// Schedule it to run a few times a day (see supabase/README.md). Wired against
// the schema but NOT executed against a real project in this build.
//
// Deploy: supabase functions deploy reminders

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LEAD_HOURS = Number(Deno.env.get('REMINDER_LEAD_HOURS') ?? '24');
const TENANT_SLUG = Deno.env.get('TENANT_SLUG') ?? 'default';

// Mirror of the `reminder` template in src/config/agenda.config.ts. Keep the two
// in sync, or read copy from a per-tenant settings row. {service} is filled with
// the service id here — join the `services` table if you want its display name.
const TEMPLATE =
  Deno.env.get('REMINDER_TEMPLATE') ??
  'Hola, {name}. Te recordamos tu turno: {service} el {date} a las {time}. Código {code}. Si no puedes asistir, avísanos.';

interface BookingRow {
  code: string;
  date: string;
  time: string;
  service_id: string;
  patient_name: string;
  patient_phone: string;
}

function compose(b: BookingRow): string {
  return TEMPLATE.replace('{name}', b.patient_name.split(' ')[0] || b.patient_name)
    .replace('{service}', b.service_id)
    .replace('{date}', b.date)
    .replace('{time}', b.time.slice(0, 5))
    .replace('{code}', b.code);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date();
  const until = new Date(now.getTime() + LEAD_HOURS * 3_600_000);
  const toDate = (d: Date) => d.toISOString().slice(0, 10);

  const { data: tenant, error: tenantErr } = await admin
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();
  if (tenantErr || !tenant) return json({ error: `tenant "${TENANT_SLUG}" not found` }, 400);

  const { data, error } = await admin
    .from('bookings')
    .select('code,date,time,service_id,patient_name,patient_phone')
    .eq('tenant_id', tenant.id)
    .eq('status', 'confirmed')
    .is('reminded_at', null)
    .gte('date', toDate(now))
    .lte('date', toDate(until));
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  for (const b of (data ?? []) as BookingRow[]) {
    const start = new Date(`${b.date}T${b.time.slice(0, 5)}:00`);
    if (start <= now || start > until) continue; // within range of dates, but outside the time window

    const res = await admin.functions.invoke('notify', {
      body: { kind: 'reminder', to: b.patient_phone, body: compose(b) },
    });
    if (res.error) continue; // leave un-reminded so the next run retries

    await admin
      .from('bookings')
      .update({ reminded_at: new Date().toISOString() })
      .eq('tenant_id', tenant.id)
      .eq('code', b.code);
    sent += 1;
  }

  return json({ ok: true, sent });
});
