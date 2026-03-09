import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket';

/**
 * MLActivityIndicator — Shows when ML is actively scoring transactions.
 * Blinks with a neural network icon on transactions.live events.
 * Covers Features 13 (ML Model Thinking), 40 (Neural Network Pulse).
 */
export const MLActivityIndicator = () => {
    const [active, setActive] = useState(false);
    const timerRef = { current: 0 as ReturnType<typeof setTimeout> };

    useEffect(() => {
        const socket = getSocket();
        const handler = () => {
            setActive(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setActive(false), 1500);
        };
        socket.on('transactions.live', handler);
        return () => {
            socket.off('transactions.live', handler);
            clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className="flex items-center gap-2">
            <AnimatePresence>
                {active && (
                    <motion.div
                        key="ml-active"
                        className="flex items-center gap-1.5"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Neural dots */}
                        {[0, 0.1, 0.2].map((delay) => (
                            <motion.div
                                key={delay}
                                className="h-1.5 w-1.5 rounded-full bg-violet-400"
                                animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay }}
                            />
                        ))}
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">ML Scoring</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
