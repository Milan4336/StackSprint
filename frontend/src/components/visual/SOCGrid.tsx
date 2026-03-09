import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

export const SOCGrid = () => {
    const { theme } = useThemeStore();

    const colors = {
        cyber: { grid: 'rgba(14, 165, 233, 0.1)', beam: 'bg-blue-400/10', shadow: 'rgba(59, 130, 246, 0.3)', secondary: 'bg-cyan-400/20' },
        neon: { grid: 'rgba(168, 85, 247, 0.1)', beam: 'bg-purple-400/10', shadow: 'rgba(168, 85, 247, 0.3)', secondary: 'bg-pink-400/20' },
        tactical: { grid: 'rgba(16, 185, 129, 0.1)', beam: 'bg-emerald-400/10', shadow: 'rgba(16, 185, 129, 0.3)', secondary: 'bg-blue-400/20' }
    }[theme] || { grid: 'rgba(14, 165, 233, 0.1)', beam: 'bg-blue-400/10', shadow: 'rgba(59, 130, 246, 0.3)', secondary: 'bg-cyan-400/20' };
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Base Grid with 3D Perspective */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="cyber-grid absolute inset-0 h-[300%] w-full animate-grid-pulse transition-all duration-1000" style={{ opacity: 0.1, backgroundImage: `linear-gradient(${colors.grid} 1px, transparent 1px), linear-gradient(90deg, ${colors.grid} 1px, transparent 1px)` }} />
            </div>

            {/* Vertical Scanning Beam */}
            <motion.div
                animate={{ x: ['-20%', '120%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className={`absolute inset-y-0 w-px ${colors.beam} z-0`}
                style={{ boxShadow: `0 0 40px ${colors.shadow}` }}
            />

            {/* Horizontal Data Sweep */}
            <motion.div
                animate={{ y: ['-20%', '120%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear', delay: 2 }}
                className={`absolute inset-x-0 h-px ${colors.secondary} z-0`}
                style={{ boxShadow: `0 0 30px ${colors.shadow}` }}
            />

            {/* Noise Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.03] z-[1] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
            />
        </div>
    );
};
