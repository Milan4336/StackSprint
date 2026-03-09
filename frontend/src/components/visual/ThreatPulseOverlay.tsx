import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useThreatStore } from '../../store/threatStore';

/**
 * ThreatPulseOverlay — Radial shockwave from screen center whenever threatIndex spikes ≥10.
 * Covers Features 2 (Threat Shockwave) and trigger from threat escalation.
 */
export const ThreatPulseOverlay = () => {
    const threatIndex = useThreatStore((state) => state.threatIndex);
    const prevIndexRef = useRef(0);
    const [pulses, setPulses] = useState<{ id: number; color: string }[]>([]);
    const idRef = useRef(0);

    useEffect(() => {
        const delta = threatIndex - prevIndexRef.current;
        if (delta >= 10) {
            const color = threatIndex >= 85
                ? 'rgba(239,68,68,0.25)'
                : threatIndex >= 65
                    ? 'rgba(249,115,22,0.2)'
                    : 'rgba(234,179,8,0.18)';

            const id = ++idRef.current;
            setPulses((prev) => [...prev, { id, color }]);
            setTimeout(() => {
                setPulses((prev) => prev.filter((p) => p.id !== id));
            }, 1200);
        }
        prevIndexRef.current = threatIndex;
    }, [threatIndex]);

    return (
        <div className="pointer-events-none fixed inset-0 z-[190] flex items-center justify-center overflow-hidden">
            <AnimatePresence>
                {pulses.map((pulse) => (
                    <motion.div
                        key={pulse.id}
                        className="absolute rounded-full"
                        style={{ background: `radial-gradient(circle, ${pulse.color} 0%, transparent 70%)` }}
                        initial={{ width: 0, height: 0, opacity: 1 }}
                        animate={{ width: '200vw', height: '200vw', opacity: 0 }}
                        exit={{}}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
