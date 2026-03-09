import React from 'react';
import { motion } from 'framer-motion';

interface HolographicIndicatorProps {
    threatIndex: number;
    label: string;
    className?: string;
}

export const HolographicIndicator: React.FC<HolographicIndicatorProps> = ({
    threatIndex,
    label,
    className = ""
}) => {
    const isCritical = threatIndex > 80;
    const color = isCritical ? 'rgba(239, 68, 68, 0.8)' : 'rgba(14, 165, 233, 0.8)';
    const glow = isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(14, 165, 233, 0.4)';

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer Technical Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-[240px] h-[240px] border border-dashed border-white/5 rounded-full"
            />

            {/* Rotating Data Ring */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-[210px] h-[210px] rounded-full"
                style={{ borderTop: `2px solid ${color}`, borderRight: `2px solid transparent` }}
            />

            {/* Pulsing Status Core */}
            <div className="status-ring w-[180px] h-[180px]">
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-4 rounded-full"
                    style={{ backgroundColor: glow, filter: 'blur(20px)' }}
                />

                <div className="relative text-center z-10">
                    <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40 mb-1">
                        System Index
                    </div>
                    <motion.div
                        key={threatIndex}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-black tracking-tighter"
                        style={{ color: '#fff', textShadow: `0 0 20px ${color}` }}
                    >
                        {threatIndex}
                    </motion.div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: color }}>
                        {label}
                    </div>
                </div>

                {/* Technical Coordinate markers */}
                {[0, 90, 180, 270].map(deg => (
                    <div
                        key={deg}
                        className="absolute w-2 h-0.5 bg-white/20"
                        style={{
                            transform: `rotate(${deg}deg) translateY(-85px)`,
                            transformOrigin: 'center'
                        }}
                    />
                ))}
            </div>

            {/* Rotating Metadata bits */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[130px] text-[8px] font-mono text-white/20 whitespace-nowrap">
                    LAT: 40.7128° N | LONG: 74.0060° W
                </div>
            </motion.div>
        </div>
    );
};
