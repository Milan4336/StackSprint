import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket';
import { ShieldAlert } from 'lucide-react';

/**
 * AttackModeOverlay — Red scanlines + "ATTACK MODE ACTIVE" on system.spike.
 * Covers Features 14 (Attack Mode Global Overlay), 43 (Critical Alert Lockdown Mode).
 */
export const AttackModeOverlay = () => {
    const [active, setActive] = useState(false);

    useEffect(() => {
        const socket = getSocket();
        const onSpike = () => {
            setActive(true);
            setTimeout(() => setActive(false), 5000); // auto-dismiss after 5s
        };
        socket.on('system.spike', onSpike);
        return () => { socket.off('system.spike', onSpike); };
    }, []);

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    key="attack-mode"
                    className="pointer-events-none fixed inset-0 z-[180]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Scanlines */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, rgba(239,68,68,0.04) 0px, rgba(239,68,68,0.04) 1px, transparent 1px, transparent 4px)',
                        }}
                    />

                    {/* Corner indicator */}
                    <motion.div
                        className="absolute top-20 right-6 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-950/80 px-3 py-2 backdrop-blur"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                        <ShieldAlert size={14} className="text-red-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Attack Mode Active</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
