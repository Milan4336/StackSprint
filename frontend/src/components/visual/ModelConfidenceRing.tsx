import { motion } from 'framer-motion';

export const ModelConfidenceRing = ({ confidence, size = 120 }: { confidence: number; size?: number }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (confidence / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background Track */}
                <circle
                    className="text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Fill */}
                <motion.circle
                    className={confidence > 80 ? 'text-blue-500' : confidence > 50 ? 'text-amber-500' : 'text-red-500'}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-2xl font-black text-white"
                >
                    {Math.round(confidence)}%
                </motion.span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Confidence</span>
            </div>

            {/* Outer Pulse */}
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border border-blue-500/20"
            />
        </div>
    );
};
