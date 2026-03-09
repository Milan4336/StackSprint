import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

export const CyberEnvironment: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme } = useThemeStore();

    const colors = {
        cyber: { primary: 'rgba(14, 165, 233, 0.03)', secondary: 'rgba(168, 85, 247, 0.03)', particle: 'bg-blue-500/40' },
        neon: { primary: 'rgba(168, 85, 247, 0.03)', secondary: 'rgba(244, 114, 182, 0.03)', particle: 'bg-purple-500/40' },
        tactical: { primary: 'rgba(16, 185, 129, 0.03)', secondary: 'rgba(59, 130, 246, 0.03)', particle: 'bg-emerald-500/40' }
    }[theme] || { primary: 'rgba(14, 165, 233, 0.03)', secondary: 'rgba(168, 85, 247, 0.03)', particle: 'bg-blue-500/40' };
    return (
        <div className="relative min-h-screen w-full bg-[#02040a] text-slate-100 overflow-hidden font-sans">
            {/* 3D Grid Perspective */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                <div className="cyber-grid absolute inset-0 h-[200%] w-full animate-grid-pulse" />
            </div>

            {/* Atmospheric Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] opacity-[0.8] blur-[120px] rounded-full transition-colors duration-1000" style={{ background: colors.primary }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] opacity-[0.8] blur-[120px] rounded-full transition-colors duration-1000" style={{ background: colors.secondary }} />
            </div>

            {/* Scanning Lines */}
            <div className="scanning-overlay z-[1]" />

            {/* Particle Field (Simplified CSS version) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className={`absolute h-1 w-1 rounded-full ${colors.particle}`}
                        initial={{
                            x: Math.random() * 100 + '%',
                            y: Math.random() * 100 + '%',
                            opacity: 0
                        }}
                        animate={{
                            y: [null, '-20%'],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: Math.random() * 30 + 20,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 20
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full h-full flex flex-col">
                {children}
            </div>

            {/* Edge Vignette */}
            <div className="absolute inset-0 pointer-events-none z-[11] shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
        </div>
    );
};
