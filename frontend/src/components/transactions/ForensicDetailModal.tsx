import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Cpu, BrainCircuit, Network, Info, ArrowRight } from 'lucide-react';
import { Transaction } from '../../types';
import { HUDPanel, HUDDataReadout, HUDCorner, HUDScanline } from '../visual/HUDDecorations';

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
                className="relative w-full max-w-5xl overflow-hidden border border-blue-500/20 bg-[#020617]/95 shadow-[0_0_100px_rgba(0,0,0,0.8)] hud-panel !p-0"
            >
                <HUDCorner position="top-left" />
                <HUDCorner position="top-right" />
                <HUDCorner position="bottom-left" />
                <HUDCorner position="bottom-right" />
                <HUDScanline />
                {/* Forensic Scanlines Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03] z-[5]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.5) 2px, rgba(59, 130, 246, 0.5) 3px)`
                    }}
                />
                <div className="flex items-center justify-between border-b border-white/5 p-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Forensic <span className="text-blue-500">Intelligence</span></h2>
                            <span className="hud-readout border-l border-blue-500/30 pl-3 text-blue-400">{transaction.transactionId}</span>
                        </div>
                        <p className="mt-1 hud-readout opacity-60">TRANSACTIONAL_RISK_VECTOR_ANALYSIS_v3.7</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="hud-panel !p-2 text-blue-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid h-[75vh] overflow-y-auto lg:grid-cols-[1fr_380px]">
                    {/* Left Side: Forensic Telemetry */}
                    <div className="p-8 space-y-8 relative z-10">
                        <div className="grid gap-6 sm:grid-cols-2">
                            {layers.map((layer) => (
                                <div key={layer.label} className={`hud-panel !bg-transparent border-blue-500/5 group hover:border-blue-500/20 transition-all`}>
                                    <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-2">
                                            <layer.icon size={18} className={layer.color} />
                                            <span className="hud-readout text-blue-400 opacity-60">{layer.label} Layer</span>
                                        </div>
                                        <span className={`text-3xl font-black italic tracking-tighter tabular-nums ${layer.color} drop-shadow-[0_0_8px_currentColor]`}>
                                            {layer.score.toFixed(0)}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {layer.reasons.length > 0 ? (
                                            layer.reasons.map((reason, i) => (
                                                <div key={i} className="flex items-start gap-3 text-[11px] font-bold text-slate-200 group-hover:text-white transition-colors">
                                                    <div className="h-1 w-1 mt-1.5 shrink-0 rounded-full bg-blue-500/40" />
                                                    {reason}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="hud-readout italic text-slate-500">NO_ANOMALY_DETECTED</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Behavior & Graph Summary */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="hud-panel !bg-transparent border-purple-500/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <BrainCircuit size={18} className="text-purple-500" />
                                    <span className="hud-readout text-purple-400">Behavior_Analysis</span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-100 leading-relaxed font-mono opacity-80">
                                    DEVIATION_INDEX: {(transaction.fraudScore / 100 * 0.25 * 100).toFixed(1)}% FROM BASELINE_FOOTPRINT
                                </p>
                            </div>
                            <div className="hud-panel !bg-transparent border-amber-500/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Network size={18} className="text-amber-500" />
                                    <span className="hud-readout text-amber-400">Graph_Vector</span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-100 leading-relaxed font-mono opacity-80">
                                    NODE_RELATION: {transaction.isFraud ? 'RISK_DETECTED' : 'NOMINAL'} IN DEVICE_CLUSTER
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Quick Stats Snapshot */}
                    <div className="border-l border-white/5 bg-blue-500/[0.02] p-8 relative z-10">
                        <span className="hud-readout text-blue-500 opacity-60 mb-8 block flex items-center gap-2">
                            <Info size={14} /> RAPID_SNAPSHOT_v2
                        </span>

                        <div className="space-y-8">
                            <div className="flex flex-col items-center justify-center py-8 hud-panel !bg-transparent border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                                <span className="hud-readout text-blue-400 opacity-60 mb-2">AGGREGATE_RISK_COEF</span>
                                <p className={`text-7xl font-black italic tracking-tighter tabular-nums drop-shadow-[0_0_20px_currentColor] ${transaction.fraudScore > 70 ? 'text-red-500' : transaction.fraudScore > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {transaction.fraudScore}
                                </p>
                                <div className="mt-6">
                                    <span className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase border drop-shadow-[0_0_8px_currentColor] ${transaction.riskLevel === 'High' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                        transaction.riskLevel === 'Medium' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                                            'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                                        }`}>
                                        {transaction.riskLevel}_SEVERITY
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <HUDDataReadout label="CURRENCY_QUANTUM" value={`$ ${transaction.amount.toLocaleString()}`} />
                                <HUDDataReadout label="SOURCE_VECTOR" value={transaction.location} />
                                <HUDDataReadout label="IP_PROTOCOL" value={transaction.ipAddress} />
                                <HUDDataReadout label="SYSTEM_DIRECTIVE" value={transaction.action || 'ALLOW_DIRECTIVE'} />
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full glass-btn !rounded-sm justify-center border-blue-500/40 text-blue-500 font-black text-xs uppercase tracking-[0.2em] py-4 hover:bg-blue-500 hover:text-white transition-all"
                            >
                                Terminate Forensic Process
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
