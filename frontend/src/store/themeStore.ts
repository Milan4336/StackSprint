import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'cyber' | 'neon' | 'tactical';

interface ThemeState {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'cyber',
            setTheme: (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                set({ theme });
            },
        }),
        {
            name: 'ui-theme-storage',
        }
    )
);
