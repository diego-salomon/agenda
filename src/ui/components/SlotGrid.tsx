import type { DaySlot } from '@/application';
import { cn } from '@/lib/cn';

const LABEL: Record<DaySlot['status'], string> = {
  free: 'Disponible',
  booked: 'Ocupado',
  blocked: 'No disponible',
  past: 'Pasado',
};

/**
 * A grid of time slots. When `onPick` is given, free slots are buttons;
 * otherwise it renders as a read-only status grid (public agenda).
 */
export function SlotGrid({
  slots,
  selected,
  onPick,
}: {
  slots: DaySlot[];
  selected?: string | null;
  onPick?: (time: string) => void;
}) {
  if (slots.length === 0) {
    return <p className="text-sm text-text-muted">Cerrado este día.</p>;
  }

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="list">
      {slots.map((slot) => {
        const isFree = slot.status === 'free';
        const isSelected = selected === slot.time;
        const common =
          'flex min-h-11 w-full flex-col items-center justify-center rounded-md border px-1 text-sm font-semibold';

        if (onPick && isFree) {
          return (
            <li key={slot.time}>
              <button
                type="button"
                data-testid="free-slot"
                onClick={() => onPick(slot.time)}
                aria-pressed={isSelected}
                className={cn(
                  common,
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  isSelected
                    ? 'border-brand bg-brand text-brand-contrast'
                    : 'border-border bg-surface text-text hover:border-brand',
                )}
              >
                {slot.time}
              </button>
            </li>
          );
        }

        return (
          <li key={slot.time}>
            <div
              className={cn(
                common,
                'cursor-default',
                isFree
                  ? 'border-border bg-surface text-text'
                  : 'border-transparent bg-surface-2 text-text-muted line-through',
              )}
              aria-label={`${slot.time} · ${LABEL[slot.status]}`}
              title={LABEL[slot.status]}
            >
              {slot.time}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
