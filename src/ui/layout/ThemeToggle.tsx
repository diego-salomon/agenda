import { useTheme } from '../theme/useTheme';

const LABELS = { system: 'Auto', light: 'Claro', dark: 'Oscuro' } as const;
const ICONS = { system: '🖥️', light: '☀️', dark: '🌙' } as const;

export function ThemeToggle() {
  const { preference, cycle } = useTheme();
  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-text hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      aria-label={`Tema: ${LABELS[preference]}. Cambiar.`}
      title={`Tema: ${LABELS[preference]}`}
    >
      <span aria-hidden="true">{ICONS[preference]}</span>
      <span className="hidden sm:inline">{LABELS[preference]}</span>
    </button>
  );
}
