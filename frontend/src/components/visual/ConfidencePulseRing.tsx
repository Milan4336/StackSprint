import { motion, AnimatePresence } from 'framer-motion';

export const ConfidencePulseRing = ({ active, color = 'blue' }: { active: boolean; color?: 'blue' | 'red' | 'amber' }) => {
    const colors = {
        blue: 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
        red: 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
        amber: 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    };

    return (
        <AnimatePresence>
            {active && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [1, 1.4, 1.6],
                            opacity: [0.6, 0.3, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut'
                        }}
                        className={`absolute w-full h-full rounded-full border-2 ${colors[color]}`}
                    />
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [1, 1.2, 1.4],
                            opacity: [0.4, 0.2, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: 0.5
                        }}
                        className={`absolute w-full h-full rounded-full border ${colors[color]}`}
                    />
                </div>
            )}
        </AnimatePresence>
    );
};
