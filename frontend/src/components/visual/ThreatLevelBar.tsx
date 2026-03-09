import { motion } from 'framer-motion';
import { useThreatStore } from '../../store/threatStore';

const LEVEL_COLORS: Record<string, string> = {
    NORMAL: '#22c55e',
    SUSPICIOUS: '#eab308',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
};

const LEVEL_LABELS: Record<string, string> = {
    NORMAL: 'THREAT NORMAL',
    SUSPICIOUS: 'SUSPICIOUS ACTIVITY',
    HIGH: 'HIGH RISK',
    CRITICAL: 'CRITICAL THREAT',
};

/**
 * ThreatLevelBar — 2px animated header bar showing global threat status.
 * Covers Feature 5 (Global Risk Level Header Bar).
 */
export const ThreatLevelBar = () => {
    const threatLevel = useThreatStore((state) => state.threatLevel);
    const threatIndex = useThreatStore((state) => state.threatIndex);
    const color = LEVEL_COLORS[threatLevel] ?? '#22c55e';

    return (
        <div className="relative h-0.5 w-full overflow-hidden bg-slate-800">
            <motion.div
                className="h-full"
                style={{ backgroundColor: color }}
                initial={{ opacity: 0 }}
                animate={{
                    width: `${Math.max(5, threatIndex)}%`,
                    opacity: 1,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {threatLevel !== 'NORMAL' && (
                <motion.div
                    className="absolute right-2 -top-3.5 text-[8px] font-black tracking-widest uppercase"
                    style={{ color }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    {LEVEL_LABELS[threatLevel]}
                </motion.div>
            )}
        </div>
    );
};
