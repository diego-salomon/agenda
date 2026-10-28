import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'danger' | 'warning';

const tones: Record<AlertTone, string> = {
  info: 'bg-surface-2 text-text border-border',
  success: 'bg-success-soft text-success border-success/30',
  danger: 'bg-danger-soft text-danger border-danger/30',
  warning: 'bg-warning-soft text-warning border-warning/30',
};

export function Alert({
  tone = 'info',
  title,
  children,
  role = 'status',
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <div role={role} className={cn('rounded-md border p-3 text-sm', tones[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && 'mt-1')}>{children}</div>}
    </div>
  );
}
