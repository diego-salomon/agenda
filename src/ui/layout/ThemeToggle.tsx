import type { FC } from 'react';
import { useTheme, type ThemePreference } from '../theme/useTheme';
import { SunIcon, MoonIcon, MonitorIcon, type IconProps } from '../components/Icon';

const LABELS: Record<ThemePreference, string> = {
  system: 'Auto',
  light: 'Claro',
  dark: 'Oscuro',
};

const ICONS: Record<ThemePreference, FC<IconProps>> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
};

export function ThemeToggle() {
  const { preference, cycle } = useTheme();
  const Icon = ICONS[preference];
  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-text hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      aria-label={`Tema: ${LABELS[preference]}. Cambiar.`}
      title={`Tema: ${LABELS[preference]}`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{LABELS[preference]}</span>
    </button>
  );
}
