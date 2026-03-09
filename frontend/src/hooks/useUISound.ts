import { useCallback } from 'react';

// Using public URLs for high-quality futuristic UI sounds
const SOUNDS = {
    CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    HOVER: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    ALERT: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
    SCAN: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3',
};

export const useUISound = () => {
    const playSound = useCallback((type: keyof typeof SOUNDS) => {
        try {
            const audio = new Audio(SOUNDS[type]);
            audio.volume = 0.15;
            audio.play().catch(() => {
                // Handle autoplay policy restrictions
            });
        } catch (e) {
            console.warn('Audio play failed', e);
        }
    }, []);

    return { playSound };
};
