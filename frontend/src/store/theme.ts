import { create } from 'zustand';

export type AppTheme = 'light' | 'dark';

interface ThemeState {
  theme: AppTheme;
  initialized: boolean;
  enableThreatGlow: boolean;
  initialize: () => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  toggleThreatGlow: () => void;
}

const applyTheme = (theme: AppTheme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.setAttribute('data-theme', theme);
};

const readThemeFromStorage = (): AppTheme => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const readGlowFromStorage = (): boolean => {
  const stored = localStorage.getItem('enableThreatGlow');
  if (stored === 'false') return false;
  return true; // Default to true if not set
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  enableThreatGlow: true,
  initialized: false,
  initialize: () => {
    if (get().initialized) return;
    const nextTheme = readThemeFromStorage();
    const nextGlow = readGlowFromStorage();
    applyTheme(nextTheme);
    set({ theme: nextTheme, enableThreatGlow: nextGlow, initialized: true });
  },
  setTheme: (theme: AppTheme) => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    set({ theme, initialized: true });
  },
  toggleTheme: () => {
    const next: AppTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
    set({ theme: next, initialized: true });
  },
  toggleThreatGlow: () => {
    const next = !get().enableThreatGlow;
    localStorage.setItem('enableThreatGlow', String(next));
    set({ enableThreatGlow: next });
  }
}));
