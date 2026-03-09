import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useThreatStore } from '../../store/threatStore';

export const ThreatShockwave = () => {
    const threatIndex = useThreatStore(state => state.threatIndex);
    const [shockwaves, setShockwaves] = useState<{ id: number; x: number; y: number }[]>([]);
    const [lastIndex, setLastIndex] = useState(threatIndex);

    useEffect(() => {
        if (threatIndex > lastIndex + 15) {
            // Significant jump detected
            setShockwaves(prev => [...prev, { id: Date.now(), x: 50, y: 50 }]);

            // Auto-cleanup
            setTimeout(() => {
                setShockwaves(prev => prev.slice(1));
            }, 2000);
        }
        setLastIndex(threatIndex);
    }, [threatIndex, lastIndex]);

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
            <AnimatePresence>
                {shockwaves.map(wave => (
                    <motion.div
                        key={wave.id}
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{
                            scale: [1, 5],
                            opacity: [0.8, 0],
                            borderWidth: ['20px', '2px']
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-red-500/50"
                        style={{ width: '100px', height: '100px' }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
