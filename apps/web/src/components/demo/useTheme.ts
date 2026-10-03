'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { type Theme, THEME_STORAGE_KEY } from '@/lib/theme';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const read = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/** The page theme (set before paint by THEME_INIT_SCRIPT) and a setter that remembers it. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'light' as const);
  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
  }, []);
  return [theme, setTheme] as const;
}
