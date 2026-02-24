import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface IntroState {
  hasSeenBootIntro: boolean;
  isBootIntroActive: boolean;
  hasHydrated: boolean;
  shouldPlayBootIntro: () => boolean;
  startBootIntro: () => void;
  completeBootIntro: () => void;
  resetBootIntro: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useIntroStore = create<IntroState>()(
  persist(
    (set, get) => ({
      hasSeenBootIntro: false,
      isBootIntroActive: false,
      hasHydrated: false,
      shouldPlayBootIntro: () => get().hasHydrated && !get().hasSeenBootIntro && !get().isBootIntroActive,
      startBootIntro: () => set({ isBootIntroActive: true }),
      completeBootIntro: () => set({ isBootIntroActive: false, hasSeenBootIntro: true }),
      resetBootIntro: () => set({ hasSeenBootIntro: false, isBootIntroActive: false }),
      setHydrated: (hydrated) => set({ hasHydrated: hydrated })
    }),
    {
      name: 'fraud-boot-intro',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenBootIntro: state.hasSeenBootIntro
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
