import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: ReactNode;
}

/** Label + input + inline error, wired up for screen readers. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error ? errorId : undefined, hint ? hintId : undefined) || undefined}
        className={cn(
          'min-h-11 rounded-md border bg-surface px-3 text-text placeholder:text-text-muted',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          error ? 'border-danger' : 'border-border',
          className,
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
