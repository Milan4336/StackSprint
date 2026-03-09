import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
    isSidebarCollapsed: boolean;
    isExecutiveMode: boolean;
    isAudioEnabled: boolean;
    toggleSidebar: () => void;
    toggleExecutiveMode: () => void;
    toggleAudio: () => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            isExecutiveMode: false,
            isAudioEnabled: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            toggleExecutiveMode: () => set((state) => ({ isExecutiveMode: !state.isExecutiveMode })),
            toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
        }),
        {
            name: 'fraud-console-ui-state',
        }
    )
);
