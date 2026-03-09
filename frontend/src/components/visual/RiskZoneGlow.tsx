import { motion } from 'framer-motion';

export const RiskZoneGlow = ({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) => {
    const colors = {
        low: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
        medium: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
        high: 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
        critical: 'bg-red-600/20 border-red-600/40 shadow-[0_0_40px_rgba(220,38,38,0.3)]',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute inset-0 rounded-2xl border pointer-events-none ${colors[level]}`}
        >
            {level === 'critical' && (
                <motion.div
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-red-600/10 rounded-2xl"
                />
            )}
        </motion.div>
    );
};
