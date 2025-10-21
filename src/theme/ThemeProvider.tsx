import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, THEME_STORAGE_KEY } from './theme';
import { useUIStore } from '@/store/uiStore';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

const getSystemTheme = (): ThemeName => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
      return stored ?? getSystemTheme();
    } catch (e) {
      return getSystemTheme();
    }
  });

  // Sync to DOM and localStorage
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'dark') {
      el.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      el.removeAttribute('data-theme');
    } else {
      // system
      try {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) el.setAttribute('data-theme', 'dark');
        else el.removeAttribute('data-theme');
      } catch (e) {
        el.removeAttribute('data-theme');
      }
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  // Subscribe to uiStore.theme so SettingsPage or other places can change theme via store
  const storeTheme = useUIStore((s) => s.theme);
  useEffect(() => {
    if (storeTheme && storeTheme !== theme) {
      setThemeState(storeTheme as ThemeName);
    }
  }, [storeTheme]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      // Only switch if user has not explicitly stored a preference
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (!stored) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      } catch (e) {
        // ignore
      }
    };
    mq?.addEventListener('change', onChange);
    return () => mq?.removeEventListener('change', onChange);
  }, []);

  const setTheme = (t: ThemeName) => setThemeState(t);
  const toggleTheme = () => setThemeState((s) => (s === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
