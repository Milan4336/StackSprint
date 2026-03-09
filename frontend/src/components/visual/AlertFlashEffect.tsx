import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';

/**
 * AlertFlashEffect — Brief red screen flash + shake when fraud.alerts fires.
 * Covers Features 3 (Fraud Event Explosion), 41 (Alert Shockwave).
 */
export const AlertFlashEffect = () => {
    const [flashes, setFlashes] = useState<number[]>([]);
    const idRef = useRef(0);

    useEffect(() => {
        const socket = getSocket();
        const handler = () => {
            const id = ++idRef.current;
            setFlashes((prev) => [...prev, id]);
            setTimeout(() => setFlashes((prev) => prev.filter((f) => f !== id)), 600);
        };

        socket.on('fraud.alerts', handler);
        return () => { socket.off('fraud.alerts', handler); };
    }, []);

    return (
        <AnimatePresence>
            {flashes.length > 0 && (
                <motion.div
                    key={flashes[0]}
                    className="pointer-events-none fixed inset-0 z-[195] bg-red-500"
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: 0 }}
                    exit={{}}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            )}
        </AnimatePresence>
    );
};
