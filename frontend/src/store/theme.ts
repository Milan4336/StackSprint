import { create } from 'zustand';

export const APP_THEMES = ['obsidian', 'arctic', 'cobalt', 'ember', 'matrix'] as const;
export type AppTheme = (typeof APP_THEMES)[number];

type ThemeMode = 'light' | 'dark';

export const THEME_META: Record<AppTheme, { label: string; mode: ThemeMode }> = {
  obsidian: { label: 'Obsidian', mode: 'dark' },
  arctic: { label: 'Arctic', mode: 'light' },
  cobalt: { label: 'Cobalt', mode: 'dark' },
  ember: { label: 'Ember', mode: 'dark' },
  matrix: { label: 'Matrix', mode: 'dark' }
};

export const isLightTheme = (theme: AppTheme): boolean => THEME_META[theme].mode === 'light';

interface ThemeState {
  theme: AppTheme;
  initialized: boolean;
  enableThreatGlow: boolean;
  initialize: () => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  toggleThreatGlow: () => void;
}

const LEGACY_THEME_MAP: Record<string, AppTheme> = {
  dark: 'obsidian',
  light: 'arctic'
};

const applyTheme = (theme: AppTheme) => {
  document.documentElement.classList.toggle('dark', !isLightTheme(theme));
  document.documentElement.setAttribute('data-theme', theme);
};

const parseStoredTheme = (raw: string | null): AppTheme | null => {
  if (!raw) return null;
  if ((APP_THEMES as readonly string[]).includes(raw)) {
    return raw as AppTheme;
  }
  return LEGACY_THEME_MAP[raw] ?? null;
};

const readThemeFromStorage = (): AppTheme => {
  const stored = parseStoredTheme(localStorage.getItem('theme'));
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'obsidian' : 'arctic';
};

const readGlowFromStorage = (): boolean => {
  const stored = localStorage.getItem('enableThreatGlow');
  if (stored === 'false') return false;
  return true;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'obsidian',
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
    const current = get().theme;
    const index = APP_THEMES.indexOf(current);
    const next = APP_THEMES[(index + 1) % APP_THEMES.length];
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

