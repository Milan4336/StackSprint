import { useEffect, useRef } from 'react';
import { useThreatStore } from '../../store/threatStore';
import { useUiStore } from '../../store/ui';

export const ThreatAudioEngine = () => {
    const threatIndex = useThreatStore(state => state.threatIndex);
    const audioEnabled = useUiStore(state => state.isAudioEnabled);
    const lastIndex = useRef(threatIndex);
    const audioContext = useRef<AudioContext | null>(null);

    const playTone = (freq: number, type: OscillatorType = 'sine', duration = 0.5) => {
        if (!audioEnabled) return;

        try {
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioContext.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio feedback failed:', e);
        }
    };

    useEffect(() => {
        if (threatIndex > lastIndex.current + 5) {
            // Escalation tone
            playTone(440, 'sine', 0.5); // A4
        } else if (threatIndex < lastIndex.current - 5) {
            // Resolution tone
            playTone(330, 'sine', 0.5); // E4
        }

        if (threatIndex > 90) {
            // Critical pulse
            const interval = setInterval(() => {
                playTone(220, 'square', 0.1); // Low critical pulse
            }, 2000);
            return () => clearInterval(interval);
        }

        lastIndex.current = threatIndex;
    }, [threatIndex, audioEnabled]);

    return null; // Side-effect only component
};
