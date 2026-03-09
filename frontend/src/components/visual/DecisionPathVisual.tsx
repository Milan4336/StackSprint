import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

interface DecisionStep {
    id: string;
    label: string;
    status: 'passed' | 'failed' | 'processing';
    score: number;
    icon: any;
}

export const DecisionPathVisual = ({ steps }: { steps: DecisionStep[] }) => {
    return (
        <div className="relative py-8 overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 overflow-x-auto no-scrollbar">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center flex-shrink-0">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative group flex flex-col items-center w-32 p-4 rounded-2xl border transition-all duration-500 ${step.status === 'failed'
                                    ? 'bg-red-500/10 border-red-500/40'
                                    : step.status === 'passed'
                                        ? 'bg-emerald-500/10 border-emerald-500/40'
                                        : 'bg-blue-500/10 border-blue-500/40 animate-pulse'
                                }`}
                        >
                            <div className={`p-2 rounded-xl mb-3 ${step.status === 'failed' ? 'text-red-400' : 'text-emerald-400'
                                }`}>
                                <step.icon size={20} />
                            </div>

                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-300">
                                {step.label}
                            </p>
                            <p className={`text-xs font-bold mt-1 ${step.status === 'failed' ? 'text-red-400' : 'text-emerald-400'
                                }`}>
                                {step.score > 0 ? `+${step.score}` : step.score}
                            </p>

                            {/* Connection Line */}
                            {idx < steps.length - 1 && (
                                <div className="absolute top-1/2 -right-4 w-4 h-px bg-slate-800" />
                            )}
                        </motion.div>

                        {idx < steps.length - 1 && (
                            <motion.div
                                animate={{ opacity: [0.2, 0.5, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="flex-shrink-0 text-slate-700"
                            >
                                <ChevronRight size={16} />
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const ChevronRight = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
    </svg>
);
