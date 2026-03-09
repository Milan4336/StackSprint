import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { useMemo } from 'react';

interface HUDCardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
    icon?: React.ReactNode;
    delay?: number;
}

export const HUDCard: React.FC<HUDCardProps> = ({
    children,
    title,
    subtitle,
    className = "",
    icon,
    delay = 0
}) => {
    const { theme } = useThemeStore();

    const themeColors = useMemo(() => {
        return {
            cyber: { primary: 'text-blue-400', secondary: 'bg-blue-500', glow: 'bg-blue-500/5', glowHover: 'group-hover:bg-blue-500/10', border: 'bg-blue-400/30', scanline: 'bg-blue-500/10' },
            neon: { primary: 'text-purple-400', secondary: 'bg-purple-500', glow: 'bg-purple-500/5', glowHover: 'group-hover:bg-purple-500/10', border: 'bg-purple-400/30', scanline: 'bg-purple-500/10' },
            tactical: { primary: 'text-emerald-400', secondary: 'bg-emerald-500', glow: 'bg-emerald-500/5', glowHover: 'group-hover:bg-emerald-500/10', border: 'bg-emerald-400/30', scanline: 'bg-emerald-500/10' }
        }[theme] || { primary: 'text-blue-400', secondary: 'bg-blue-500', glow: 'bg-blue-500/5', glowHover: 'group-hover:bg-blue-500/10', border: 'bg-blue-400/30', scanline: 'bg-blue-500/10' };
    }, [theme]);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay }}
            className={`relative group ${className}`}
        >
            {/* Glow Effect */}
            <div className={`absolute -inset-1 ${themeColors.glow} blur-2xl ${themeColors.glowHover} transition-all duration-700 pointer-events-none`} />

            {/* Main Container */}
            <div className="cyber-panel hud-clipped p-6 relative">
                {/* Decorative Corner Lines */}
                <div className={`absolute top-0 right-0 w-8 h-[1px] ${themeColors.border}`} />
                <div className={`absolute top-0 right-0 w-[1px] h-8 ${themeColors.border}`} />
                <div className={`absolute bottom-0 left-0 w-8 h-[1px] ${themeColors.border}`} />
                <div className={`absolute bottom-0 left-0 w-[1px] h-8 ${themeColors.border}`} />

                {/* Scanning Line (Subtle) */}
                <div className={`absolute top-0 left-0 w-full h-[1px] ${themeColors.scanline} animate-[scanLineX_4s_linear_infinite]`} />

                {header()}

                <div className="relative z-10 font-sans tracking-wide leading-relaxed">
                    {children}
                </div>

                {/* Footer Technical Readout */}
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center opacity-30">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Interface v4.0.2</span>
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Secure Node: Alpha-7</span>
                </div>
            </div>
        </motion.div>
    );

    function header() {
        if (!title && !subtitle && !icon) return null;
        return (
            <div className="mb-6 flex items-start justify-between border-b border-white/5 pb-4">
                <div className="space-y-1">
                    {subtitle && (
                        <div className={`text-[10px] uppercase tracking-[0.3em] ${themeColors.primary} opacity-60 font-mono`}>
                            {subtitle}
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        {icon && <div className={themeColors.primary}>{icon}</div>}
                        <h3 className="text-lg font-black tracking-tight uppercase bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            {title}
                        </h3>
                    </div>
                </div>
                <div className={`h-2 w-2 rounded-full ${themeColors.secondary} animate-pulse shadow-[0_0_10px_currentColor]`} />
            </div>
        );
    }
};
