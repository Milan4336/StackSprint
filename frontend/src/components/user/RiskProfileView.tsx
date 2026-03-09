import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Info, TrendingDown, Clock, MapPin } from 'lucide-react';

interface RiskFactor {
    id: string;
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
}

export const RiskProfileView = ({ score, factors }: { score: number; factors: RiskFactor[] }) => {
    const getStatus = () => {
        if (score < 20) return { label: 'SECURE', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        if (score < 60) return { label: 'MONITORED', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        return { label: 'AT RISK', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    };

    const status = getStatus();

    return (
        <div className="space-y-6">
            <div className={`p-8 rounded-[32px] border ${status.border} ${status.bg} backdrop-blur-xl relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${status.bg} ${status.color} border ${status.border}`}>
                            {status.label}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-500" />
                        <span className="text-[10px] font-bold text-slate-400">AI SAFETY SCORE</span>
                    </div>

                    <div className="flex items-end gap-4">
                        <h2 className="text-7xl font-black text-white tracking-tighter">{score}</h2>
                        <div className="mb-2">
                            <TrendingDown size={24} className="text-emerald-400 mb-1" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Risk Decreasing</p>
                        </div>
                    </div>

                    <p className="mt-8 text-sm text-slate-300 max-w-md leading-relaxed">
                        Your account is being protected by our global fraud ensemble. Your current score is based on recent activity, device health, and geographic patterns.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {factors.map((factor, idx) => (
                    <motion.div
                        key={factor.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-xl ${factor.impact === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                                    factor.impact === 'negative' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                {factor.impact === 'positive' ? <ShieldCheck size={18} /> :
                                    factor.impact === 'negative' ? <AlertTriangle size={18} /> : <Info size={18} />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">
                                {factor.impact}
                            </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight mb-1">{factor.factor}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{factor.description}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
