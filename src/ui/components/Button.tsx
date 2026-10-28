import type { ButtonHTMLAttributes, Ref } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold ' +
  'transition duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-[0.98] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none';

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-contrast hover:opacity-90 outline-ring',
  secondary: 'bg-surface-2 text-text hover:bg-border outline-ring',
  ghost: 'bg-transparent text-text hover:bg-surface-2 outline-ring',
  danger: 'bg-danger text-danger-contrast hover:opacity-90 outline-danger',
};

/** Shared classes so a react-router <Link> can look like a button too. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(base, sizes[size], variants[variant]);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button ref={ref} type={type} className={cn(buttonClasses(variant, size), className)} {...rest} />
  );
}
