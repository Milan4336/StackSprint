import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, RiskLevel, FraudExplanation } from '../../types';
import { formatSafeDate, safeDate } from '../../utils/date';
import { RiskBadge } from '../RiskBadge';
import { getSocket } from '../../services/socket';

export const TransactionStream = () => {
    const [stream, setStream] = useState<Transaction[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = getSocket();

        const handler = (payload: Record<string, unknown>) => {
            const tx: Transaction = {
                transactionId: String(payload.transactionId ?? `ev-${Date.now()}`),
                userId: String(payload.userId ?? 'unknown'),
                amount: Number(payload.amount ?? 0),
                currency: 'USD',
                location: String(payload.location ?? 'Unknown'),
                deviceId: String(payload.deviceId ?? 'unknown-device'),
                ipAddress: String(payload.ipAddress ?? '0.0.0.0'),
                timestamp:
                    safeDate(payload.timestamp as string | number | Date | null)?.toISOString() ??
                    new Date().toISOString(),
                fraudScore: Number(payload.fraudScore ?? 0),
                riskLevel: (payload.riskLevel as RiskLevel) ?? 'Low',
                isFraud: Boolean(payload.isFraud ?? false),
                ruleReasons: Array.isArray(payload.ruleReasons) ? (payload.ruleReasons as string[]) : [],
                explanations: (payload.explanations as FraudExplanation[]) ?? []
            };

            setStream(prev => [tx, ...prev].slice(0, 12));
        };

        socket.on('transactions.live', handler);
        return () => { socket.off('transactions.live', handler); };
    }, []);

    return (
        <div className="w-full h-full p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex justify-between items-center">
                <span>Live Transaction Stream</span>
                <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stream.length > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${stream.length > 0 ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </span>
            </h3>

            <div className="flex-1 overflow-hidden relative" ref={scrollRef}>
                <div className="absolute inset-0 overflow-y-auto modern-scrollbar pr-2 space-y-2">
                    <AnimatePresence initial={false}>
                        {stream.length === 0 ? (
                            <div className="text-xs text-slate-500 italic mt-4 text-center">
                                Waiting for live transactions...
                            </div>
                        ) : stream.map(tx => {
                            const isHighRisk = tx.fraudScore >= 70 || tx.riskLevel === 'High';
                            const isCritical = tx.fraudScore >= 85;
                            return (
                                <motion.div
                                    key={tx.transactionId}
                                    initial={{ opacity: 0, x: -20, scale: 0.97 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25 }}
                                    className={`p-3 rounded-lg border flex justify-between items-center
                                        ${isCritical
                                            ? 'border-red-500/40 bg-red-500/10'
                                            : isHighRisk
                                                ? 'border-amber-500/30 bg-amber-500/5'
                                                : 'border-slate-700/50 bg-slate-800/30'}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-slate-300">
                                                {tx.transactionId.substring(0, 10)}
                                            </span>
                                            <RiskBadge value={tx.riskLevel} />
                                            {isCritical && (
                                                <motion.span
                                                    className="text-[9px] font-black text-red-400 uppercase"
                                                    animate={{ opacity: [1, 0.4, 1] }}
                                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                                >
                                                    CRITICAL
                                                </motion.span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            {formatSafeDate(tx.timestamp)} · {tx.location}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-black ${isCritical ? 'text-red-400' : isHighRisk ? 'text-amber-300' : 'text-slate-200'}`}>
                                            ${tx.amount.toFixed(2)}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            Score: {tx.fraudScore.toFixed(0)}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
