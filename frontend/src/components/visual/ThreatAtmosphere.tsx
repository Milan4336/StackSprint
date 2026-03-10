import { motion } from 'framer-motion';
import { useThreatStore } from '../../store/threatStore';

/**
 * ThreatAtmosphere — Living background that subtly shifts color based on threatIndex.
 * Covers Features 1 (Dynamic atmosphere), 7 (Breathing effect), 12 (Background gradient shift).
 */
export const ThreatAtmosphere = () => {
    const threatIndex = useThreatStore((state) => state.threatIndex);
    const threatLevel = useThreatStore((state) => state.threatLevel);

    const isCritical = threatIndex >= 85;
    const isHigh = threatIndex >= 65;
    const isElevated = threatIndex >= 40;

    // Background gradient orbs that shift based on threat
    const orb1Color = isCritical
        ? 'rgba(239,68,68,0.08)'
        : isHigh
            ? 'rgba(249,115,22,0.07)'
            : isElevated
                ? 'rgba(234,179,8,0.05)'
                : 'rgba(59,130,246,0.05)';

    const orb2Color = isCritical
        ? 'rgba(185,28,28,0.06)'
        : isHigh
            ? 'rgba(234,88,12,0.05)'
            : 'rgba(139,92,246,0.05)';

    const breatheDuration = isCritical ? 1.5 : isHigh ? 2.5 : 4;

    return (
        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
            {/* Ambient orb 1 (top-right) */}
            <motion.div
                className="absolute rounded-full blur-[120px]"
                style={{
                    width: 600,
                    height: 600,
                    top: -100,
                    right: -100,
                    background: orb1Color,
                }}
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.8, 1, 0.8],
                }}
                transition={{
                    repeat: Infinity,
                    duration: breatheDuration,
                    ease: 'easeInOut',
                }}
            />

            {/* Ambient orb 2 (bottom-left) */}
            <motion.div
                className="absolute rounded-full blur-[120px]"
                style={{
                    width: 500,
                    height: 500,
                    bottom: -100,
                    left: -100,
                    background: orb2Color,
                }}
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 1, 0.7],
                }}
                transition={{
                    repeat: Infinity,
                    duration: breatheDuration * 1.3,
                    ease: 'easeInOut',
                    delay: 0.5,
                }}
            />

            {/* Critical: dark screen overlay to focus attention */}
            {threatIndex > 90 && (
                <motion.div
                    className="absolute inset-0 bg-slate-950/60 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
                </motion.div>
            )}

            {isCritical && !(threatIndex > 90) && (
                <motion.div
                    className="absolute inset-0 bg-red-950/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    key={threatLevel}
                />
            )}

            {/* Subtle SOC grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            />
        </div>
    );
};
