import { motion } from 'framer-motion';

export const ExplosionMarker = ({ active }: { active: boolean }) => {
    const particles = Array.from({ length: 12 });

    return (
        <div className="relative flex items-center justify-center">
            {active && particles.map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{
                        x: (Math.random() - 0.5) * 60,
                        y: (Math.random() - 0.5) * 60,
                        scale: 0,
                        opacity: 0
                    }}
                    transition={{ duration: 0.8, ease: 'circOut' }}
                    className="absolute w-1 h-1 bg-red-500 rounded-full"
                />
            ))}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: active ? [0, 1.5, 0] : 0 }}
                className="w-4 h-4 rounded-full bg-red-500/30 border border-red-500"
            />
        </div>
    );
};
