-- Reminder tracking. When a confirmation reminder has been sent for a booking,
-- `reminded_at` is stamped so a scheduled run never sends it twice. Kept as its
-- own migration so 0001 stays the original schema.

alter table bookings add column if not exists reminded_at timestamptz;

-- The scheduler's lookup: confirmed bookings in a date range not yet reminded.
create index if not exists bookings_reminder_due
  on bookings (tenant_id, date)
  where status = 'confirmed' and reminded_at is null;
