import { AgendaDate, DayAggregate, type Block, type Booking, type BookingStatus } from '@/domain';
import type { AgendaRepository } from '@/application';
import type { SupabaseClient } from '@supabase/supabase-js';

interface BookingRow {
  code: string;
  date: string;
  time: string;
  service_id: string;
  patient_name: string;
  patient_phone: string;
  status: BookingStatus;
  created_at: string;
  cancelled_at: string | null;
}

interface BlockRow {
  date: string;
  time: string;
  reason: string | null;
  created_at: string;
}

function toBooking(row: BookingRow): Booking {
  return {
    code: row.code,
    date: row.date,
    time: row.time.slice(0, 5),
    serviceId: row.service_id,
    patient: { name: row.patient_name, phone: row.patient_phone },
    status: row.status,
    createdAt: row.created_at,
    ...(row.cancelled_at ? { cancelledAt: row.cancelled_at } : {}),
  };
}

function toBlock(row: BlockRow): Block {
  return {
    date: row.date,
    time: row.time.slice(0, 5),
    ...(row.reason ? { reason: row.reason } : {}),
    createdAt: row.created_at,
  };
}

/**
 * Live adapter. Reads/writes the `bookings` and `blocks` tables scoped to a
 * tenant. Public booking creation is funnelled through the security-definer
 * `create_booking` RPC, which re-checks slot availability server-side (the
 * localStorage adapter can't be raced; Postgres can, so the DB is the final
 * authority). Admin mutations run authenticated under RLS.
 *
 * NOTE: this adapter is wired against the schema in /supabase but has not been
 * executed against a live project in this build — see supabase/README.md.
 */
export class SupabaseAgendaRepository implements AgendaRepository {
  private tenantIdCache: string | null = null;

  constructor(
    private readonly client: SupabaseClient,
    private readonly tenantSlug: string,
  ) {}

  private async tenantId(): Promise<string> {
    if (this.tenantIdCache) return this.tenantIdCache;
    const { data, error } = await this.client
      .from('tenants')
      .select('id')
      .eq('slug', this.tenantSlug)
      .single();
    if (error || !data) throw new Error(`Tenant "${this.tenantSlug}" no encontrado.`);
    this.tenantIdCache = data.id as string;
    return this.tenantIdCache;
  }

  async loadDay(date: AgendaDate): Promise<DayAggregate> {
    const iso = date.toISO();
    const tenant = await this.tenantId();
    const [bookings, blocks] = await Promise.all([
      this.client.from('bookings').select('*').eq('tenant_id', tenant).eq('date', iso),
      this.client.from('blocks').select('*').eq('tenant_id', tenant).eq('date', iso),
    ]);
    if (bookings.error) throw bookings.error;
    if (blocks.error) throw blocks.error;
    return DayAggregate.create(
      date,
      (bookings.data as BookingRow[]).map(toBooking),
      (blocks.data as BlockRow[]).map(toBlock),
    );
  }

  async save(day: DayAggregate): Promise<void> {
    const tenant = await this.tenantId();
    const iso = day.date.toISO();
    const current = await this.loadDay(day.date);
    const currentByCode = new Map(current.bookings.map((b) => [b.code, b]));

    for (const booking of day.bookings) {
      const existing = currentByCode.get(booking.code);
      if (!existing) {
        // New booking: go through the server-side availability re-check.
        const { error } = await this.client.rpc('create_booking', {
          p_slug: this.tenantSlug,
          p_code: booking.code,
          p_service_id: booking.serviceId,
          p_date: booking.date,
          p_time: booking.time,
          p_name: booking.patient.name,
          p_phone: booking.patient.phone,
        });
        if (error) throw error;
      } else if (existing.status !== booking.status || existing.time !== booking.time) {
        const { error } = await this.client
          .from('bookings')
          .update({
            status: booking.status,
            time: booking.time,
            cancelled_at: booking.cancelledAt ?? null,
          })
          .eq('tenant_id', tenant)
          .eq('code', booking.code);
        if (error) throw error;
      }
    }

    // Blocks carry no status, so reconcile by replacing the day's set.
    const del = await this.client.from('blocks').delete().eq('tenant_id', tenant).eq('date', iso);
    if (del.error) throw del.error;
    if (day.blocks.length > 0) {
      const ins = await this.client.from('blocks').insert(
        day.blocks.map((b) => ({
          tenant_id: tenant,
          date: b.date,
          time: b.time,
          reason: b.reason ?? null,
          created_at: b.createdAt,
        })),
      );
      if (ins.error) throw ins.error;
    }
  }

  async findByCode(code: string): Promise<Booking | null> {
    const tenant = await this.tenantId();
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenant)
      .eq('code', code)
      .maybeSingle();
    if (error) throw error;
    return data ? toBooking(data as BookingRow) : null;
  }

  async bookingsBetween(from: AgendaDate, to: AgendaDate): Promise<readonly Booking[]> {
    const tenant = await this.tenantId();
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenant)
      .gte('date', from.toISO())
      .lte('date', to.toISO());
    if (error) throw error;
    return (data as BookingRow[]).map(toBooking);
  }

  async blocksBetween(from: AgendaDate, to: AgendaDate): Promise<readonly Block[]> {
    const tenant = await this.tenantId();
    const { data, error } = await this.client
      .from('blocks')
      .select('*')
      .eq('tenant_id', tenant)
      .gte('date', from.toISO())
      .lte('date', to.toISO());
    if (error) throw error;
    return (data as BlockRow[]).map(toBlock);
  }

  async resetDemo(): Promise<void> {
    // No-op in live mode: there is no demo data to reset.
  }
}
