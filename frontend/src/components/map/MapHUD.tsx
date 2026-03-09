import { motion } from 'framer-motion';
import { Zap, ShieldAlert, TrendingUp } from 'lucide-react';
import { HUDCard } from '../layout/HUDCard';

interface MapHUDProps {
    threatIndex: number;
}

export const MapHUD = ({ threatIndex }: MapHUDProps) => {
    const getThreatColor = (index: number) => {
        if (index > 80) return 'text-red-500';
        if (index > 50) return 'text-orange-500';
        return 'text-emerald-500';
    };

    const getThreatLabel = (index: number) => {
        if (index > 80) return 'CRITICAL_ALERT';
        if (index > 50) return 'ELEVATED_THREAT';
        return 'NOMINAL_STATE';
    };

    return (
        <div className="flex flex-col gap-6 items-end pointer-events-auto">
            {/* Central Threat Index */}
            <div className="relative h-40 w-40 flex items-center justify-center">
                {/* Decorative Rings */}
                <div className="absolute inset-0 border-[8px] border-white/5 rounded-full" />
                <motion.div
                    className="absolute inset-0 border-[8px] border-blue-600/20 rounded-full"
                    style={{ clipPath: `inset(${(100 - threatIndex)}% 0 0 0)` }}
                />

                {/* Main Indicator */}
                <div className="text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: indexToScale(threatIndex) }}
                        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
                        className={`text-4xl font-black italic tracking-tighter ${getThreatColor(threatIndex)}`}
                    >
                        {threatIndex.toFixed(0)}
                    </motion.div>
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                        THREAT_INDEX
                    </div>
                </div>

                {/* Outer Glow */}
                <div className={`absolute -inset-4 rounded-full blur-2xl opacity-20 ${getThreatColor(threatIndex).replace('text', 'bg')}`} />
            </div>

            {/* Quick Stats Panel */}
            <HUDCard className="w-64 bg-black/40 border-white/10">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={12} className="text-yellow-400" /> Coordinated Waves
                        </span>
                        <span className="text-xs font-black text-white">04</span>
                    </div>

                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform">
                            <ShieldAlert size={64} />
                        </div>
                        <div className="relative z-10">
                            <div className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Status</div>
                            <div className="text-[10px] font-black text-red-500 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />
                                {getThreatLabel(threatIndex)}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Delta Index</span>
                            <span className="text-[10px] font-black text-emerald-500">+2.4%</span>
                        </div>
                        <TrendingUp size={20} className="text-emerald-500 opacity-30" />
                    </div>
                </div>
            </HUDCard>
        </div>
    );
};

const indexToScale = (index: number) => {
    return 1 + (index / 400);
};
