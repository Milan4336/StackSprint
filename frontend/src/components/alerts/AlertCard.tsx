import React from 'react';
import { motion } from 'framer-motion';
import { AlertRecord, AlertSeverity } from '../../types';
import { AlertCircle, Clock, MapPin, User, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { HUDCorner, HUDScanline } from '../visual/HUDDecorations';
import { useUISound } from '../../hooks/useUISound';
import { useThemeStore } from '../../store/themeStore';
import { useMemo } from 'react';

interface AlertCardProps {
    alert: AlertRecord;
    onAcknowledge: (id: string) => void;
}

const severityColors: Record<AlertSeverity, { text: string; border: string; bg: string; pulse: string }> = {
    LOW: { text: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', pulse: 'bg-blue-500/20' },
    MEDIUM: { text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', pulse: 'bg-emerald-500/20' },
    HIGH: { text: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5', pulse: 'bg-orange-500/20' },
    CRITICAL: { text: 'text-red-500', border: 'border-red-500/40', bg: 'bg-red-500/10', pulse: 'bg-red-500/40' }
};

const severityIcons: Record<AlertSeverity, React.ReactNode> = {
    LOW: <Clock size={16} />,
    MEDIUM: <ShieldCheck size={16} />,
    HIGH: <AlertCircle size={16} />,
    CRITICAL: <Zap size={16} className="animate-pulse" />
};

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge }) => {
    const isCritical = alert.severity === 'CRITICAL';
    const isAcknowledged = alert.status === 'ACKNOWLEDGED';
    const colors = severityColors[alert.severity];
    const { playSound } = useUISound();
    const { theme } = useThemeStore();

    const themeColors = useMemo(() => {
        return {
            cyber: { accent: 'text-blue-400', border: 'border-blue-500/30' },
            neon: { accent: 'text-purple-400', border: 'border-purple-500/30' },
            tactical: { accent: 'text-emerald-400', border: 'border-emerald-500/30' }
        }[theme] || { accent: 'text-blue-400', border: 'border-blue-500/30' };
    }, [theme]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseEnter={() => playSound('HOVER')}
            className={`relative overflow-hidden p-6 transition-all duration-300 hud-panel ${colors.border} ${colors.bg} ${isAcknowledged ? 'opacity-40 grayscale-[0.5]' : ''} group`}
        >
            <HUDCorner position="top-right" />
            <HUDScanline />

            {/* Real-time pulse for critical alerts */}
            {!isAcknowledged && isCritical && (
                <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-red-500/5 pointer-events-none"
                />
            )}

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-current ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {severityIcons[alert.severity]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">{alert.alertId}</span>
                            {isCritical && (
                                <motion.span
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest"
                                >
                                    IMMEDIATE_THREAT
                                </motion.span>
                            )}
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mt-1">FRAUD_BREACH_DETECTED</h4>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-black italic tracking-tighter tabular-nums ${colors.text} drop-shadow-[0_0_8px_currentColor]`}>
                        {(alert.fraudScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em]">RISK_COEF</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 relative z-10 border-y border-white/5 py-4">
                <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Node_Entity</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-200 font-bold">
                        <User size={12} className={`${themeColors.accent} opacity-60`} />
                        <span className="truncate">{alert.userId}</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Spatial_Vector</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-200 font-bold">
                        <MapPin size={12} className={`${themeColors.accent} opacity-60`} />
                        <span className="truncate">{alert.payload.location}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-6 relative z-10">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Anomaly_Triggers</span>
                {alert.payload.reasons.map((reason, i) => (
                    <div key={i} className={`flex items-start gap-2 text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-1 rounded-sm border-l-2 ${themeColors.border}`}>
                        <ArrowRight size={10} className={`mt-0.5 shrink-0 ${themeColors.accent}`} />
                        {reason}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-4 relative z-10 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        T- {formatDistanceToNow(new Date(alert.createdAt))}
                    </span>
                </div>

                {!isAcknowledged ? (
                    <button
                        onClick={() => { playSound('SCAN'); onAcknowledge(alert.alertId); }}
                        className={`group/btn relative overflow-hidden px-4 py-2 bg-white/5 hover:${themeColors.accent.replace('text-', 'bg-')} ${themeColors.accent} hover:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all duration-300 border ${themeColors.border}`}
                    >
                        <span className="relative z-10">Acknowledge</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-sm border border-emerald-500/20">
                        <ShieldCheck size={14} />
                        Protocol_Resolved
                    </div>
                )}
            </div>
        </motion.div>
    );
};
