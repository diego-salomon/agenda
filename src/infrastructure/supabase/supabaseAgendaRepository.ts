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

interface AvailabilityRow {
  time: string;
  status: 'booked' | 'blocked';
  service_id: string | null;
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

function sameBlocks(a: readonly Block[], b: readonly Block[]): boolean {
  if (a.length !== b.length) return false;
  const key = (x: Block) => `${x.time}|${x.reason ?? ''}`;
  const left = a.map(key).sort().join(',');
  const right = b.map(key).sort().join(',');
  return left === right;
}

/**
 * Live adapter. Reads/writes `bookings` and `blocks` scoped to a tenant.
 *
 * Who is calling matters under RLS:
 * - Signed-in admin → reads the real tables (full patient data).
 * - Anonymous visitor → reads only busy/blocked times through the
 *   security-definer `availability` RPC (never patient data), and creates
 *   bookings through the `create_booking` RPC (server re-checks the slot). The
 *   `availability` RPC returns `service_id` so duration-aware coverage still
 *   works for the public pages.
 * - Code lookup (/mi-turno) goes through the `find_booking` RPC, which works for
 *   anonymous visitors who hold the code.
 *
 * NOTE: wired against the schema in /supabase but NOT executed against a live
 * project in this build. Remaining known gap: cancel-by-code for an anonymous
 * visitor needs the `cancel_booking` RPC wired through a port method (see
 * supabase/README.md); admin cancel works under RLS.
 */
export class SupabaseAgendaRepository implements AgendaRepository {
  private tenantIdCache: string | null = null;

  constructor(
    private readonly client: SupabaseClient,
    private readonly tenantSlug: string,
  ) {}

  private async hasSession(): Promise<boolean> {
    const { data } = await this.client.auth.getSession();
    return Boolean(data.session);
  }

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

    if (await this.hasSession()) {
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

    // Public: availability only, no patient data.
    const { data, error } = await this.client.rpc('availability', {
      p_slug: this.tenantSlug,
      p_date: iso,
    });
    if (error) throw error;
    const bookings: Booking[] = [];
    const blocks: Block[] = [];
    for (const row of (data as AvailabilityRow[]) ?? []) {
      const time = row.time.slice(0, 5);
      if (row.status === 'blocked') {
        blocks.push({ date: iso, time, createdAt: '' });
      } else {
        bookings.push({
          code: '',
          date: iso,
          time,
          serviceId: row.service_id ?? '',
          patient: { name: '', phone: '' },
          status: 'confirmed',
          createdAt: '',
        });
      }
    }
    return DayAggregate.create(date, bookings, blocks);
  }

  async save(day: DayAggregate): Promise<void> {
    const tenant = await this.tenantId();
    const iso = day.date.toISO();
    const current = await this.loadDay(day.date);
    const currentByCode = new Map(current.bookings.map((b) => [b.code, b]));

    for (const booking of day.bookings) {
      if (booking.code === '') continue; // synthetic public-availability row
      const existing = currentByCode.get(booking.code);
      if (!existing) {
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

    // Blocks (admin-only under RLS): touch them only when they actually changed,
    // so a public booking on a day that has blocks never attempts a write.
    if (!sameBlocks(current.blocks, day.blocks)) {
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
  }

  async findByCode(code: string): Promise<Booking | null> {
    // RPC so an anonymous visitor who holds the code can look it up.
    const { data, error } = await this.client.rpc('find_booking', {
      p_slug: this.tenantSlug,
      p_code: code,
    });
    if (error) throw error;
    const rows = (data as BookingRow[]) ?? [];
    return rows.length > 0 ? toBooking(rows[0]) : null;
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
