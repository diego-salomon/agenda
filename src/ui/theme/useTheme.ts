import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'agenda.theme';

function read(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // ignore (private mode / blocked storage)
  }
  return 'system';
}

function apply(pref: ThemePreference): void {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
}

/** Light/dark/system preference, persisted per viewer and reflected on <html>. */
export function useTheme(): {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  cycle: () => void;
} {
  const [preference, setState] = useState<ThemePreference>(read);

  useEffect(() => {
    apply(preference);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setState(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {
      // ignore
    }
  }, []);

  const cycle = useCallback(() => {
    setState((prev) => {
      const next: ThemePreference = prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { preference, setPreference, cycle };
}
