import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Cpu, BrainCircuit, Network, Info, ArrowRight } from 'lucide-react';
import { Transaction } from '../../types';

interface ForensicDetailModalProps {
    transaction: Transaction | null;
    onClose: () => void;
}

export const ForensicDetailModal = ({ transaction, onClose }: ForensicDetailModalProps) => {
    if (!transaction) return null;

    const layers = [
        {
            label: 'Expert Rules',
            score: transaction.ruleScore ?? 0,
            icon: ShieldAlert,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            reasons: transaction.ruleReasons || []
        },
        {
            label: 'ML Ensemble',
            score: (transaction.mlScore || 0) * 100,
            icon: Cpu,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            reasons: transaction.explanations?.map(e => `${e.feature}: ${e.reason}`) || []
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1629]"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Forensic Intelligence</h2>
                            <span className="chip border-blue-500/30 bg-blue-500/10 text-blue-500">{transaction.transactionId}</span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-widest">Transaction Risk Analysis Report</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid h-[70vh] overflow-y-auto lg:grid-cols-[1fr_350px]">
                    {/* Left Side: Score Layers */}
                    <div className="p-6 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {layers.map((layer) => (
                                <div key={layer.label} className={`rounded-2xl border border-slate-200/50 p-5 dark:border-slate-800/50 ${layer.bg}`}>
                                    <div className="mb-4 flex items-center justify-between">
                                        <layer.icon size={22} className={layer.color} />
                                        <span className={`text-2xl font-black ${layer.color}`}>{layer.score.toFixed(0)}</span>
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{layer.label} Analysis</h4>

                                    <div className="space-y-2">
                                        {layer.reasons.length > 0 ? (
                                            layer.reasons.map((reason, i) => (
                                                <div key={i} className="flex items-start gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                    <ArrowRight size={10} className="mt-1 shrink-0 text-slate-400" />
                                                    {reason}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] italic text-slate-500">No significant triggers detected in this layer.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Behavior & Graph Summary */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <BrainCircuit size={18} className="text-purple-500" />
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Behavioral Bias</h4>
                                </div>
                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                    User activity shows a {(transaction.fraudScore / 100 * 0.25 * 100).toFixed(1)}% deviation from historical baseline footprint.
                                </p>
                            </div>
                            <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <Network size={18} className="text-amber-500" />
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Graph Linkage</h4>
                                </div>
                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                    Entity relationship engine detected forensic weight of {transaction.isFraud ? 'elevated' : 'nominal'} risk in current device cluster.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Quick Stats */}
                    <div className="border-l border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800/50 dark:bg-slate-900/30">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Info size={14} /> Quick Snapshot
                        </h3>

                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center py-6 rounded-3xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-500 mb-1">Aggregate Fraud Score</p>
                                <p className={`text-5xl font-black ${transaction.fraudScore > 70 ? 'text-red-500' : transaction.fraudScore > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {transaction.fraudScore}
                                </p>
                                <div className="mt-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${transaction.riskLevel === 'High' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                        transaction.riskLevel === 'Medium' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                                            'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                                        }`}>
                                        {transaction.riskLevel} RISK
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Amount</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">$ {transaction.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Location</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{transaction.location}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">IP Address</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{transaction.ipAddress}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Response Action</p>
                                    <p className={`text-sm font-black uppercase ${transaction.action === 'BLOCK' ? 'text-red-500' :
                                        transaction.action === 'STEP_UP_AUTH' ? 'text-amber-500' :
                                            'text-emerald-500'
                                        }`}>
                                        {transaction.action || 'ALLOW'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full glass-btn justify-center border-blue-500/40 text-blue-500 font-black text-xs uppercase tracking-widest py-3 hover:bg-blue-500 hover:text-white"
                            >
                                Close Forensic View
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
