import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'danger' | 'warning' | 'muted';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-text',
  brand: 'bg-brand text-brand-contrast',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  muted: 'bg-surface-2 text-text-muted',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
