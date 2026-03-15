import { useEffect, useState } from 'react';
import { useDevicesSlice } from '../store/slices/devicesSlice';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { Smartphone, Laptop, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../types';
import { DeviceIntelligencePanel } from '../components/dashboard/DeviceIntelligencePanel';

interface DeviceRank {
    deviceId: string;
    riskScore: number;
    txCount: number;
    fraudCount: number;
    accounts: Set<string>;
    lastSeen: string;
}

const computeDeviceLeaderboard = (transactions: Transaction[]): DeviceRank[] => {
    const map = new Map<string, DeviceRank>();

    for (const tx of transactions) {
        const existing = map.get(tx.deviceId) ?? {
            deviceId: tx.deviceId,
            riskScore: 0,
            txCount: 0,
            fraudCount: 0,
            accounts: new Set<string>(),
            lastSeen: tx.timestamp,
        };
        existing.txCount++;
        if (tx.isFraud) existing.fraudCount++;
        existing.accounts.add(tx.userId);
        existing.riskScore = Math.round(
            (existing.fraudCount / existing.txCount) * 100 * 0.6 +
            (tx.fraudScore ?? 0) * 0.4
        );
        if (!existing.lastSeen || tx.timestamp > existing.lastSeen) {
            existing.lastSeen = tx.timestamp;
        }
        map.set(tx.deviceId, existing);
    }

    return Array.from(map.values())
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);
};

const reputationLabel = (score: number) => {
    if (score >= 75) return { label: 'HIGH RISK', tone: 'danger' as const };
    if (score >= 40) return { label: 'MEDIUM RISK', tone: 'warning' as const };
    return { label: 'TRUSTED', tone: 'success' as const };
};

export const Devices = () => {
    const { connectLive, disconnectLive } = useDevicesSlice();
    const [selected, setSelected] = useState<DeviceRank | null>(null);

    const { data: transactions } = useQuery({
        queryKey: ['devices-transactions'],
        queryFn: () => monitoringApi.getTransactions(500),
        refetchInterval: 15000,
    });

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    const { data: deviceIntelligence } = useQuery({
        queryKey: ['devices-intelligence'],
        queryFn: () => monitoringApi.getDeviceIntelligence(100),
        refetchInterval: 15000,
    });

    const leaderboard = transactions ? computeDeviceLeaderboard(transactions) : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="theme-page-title">Device Fingerprints</h1>
                <p className="theme-page-subtitle">Hardware reputation tracking and shared origin connections.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leaderboard */}
                <div className="theme-surface-card h-96 p-6 flex flex-col">
                    <h3 className="theme-stat-label mb-4">
                        Suspicious Device Leaderboard
                    </h3>
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1 modern-scrollbar">
                        {leaderboard.length === 0 ? (
                            <div className="theme-muted-text flex h-full items-center justify-center text-xs">
                                Loading device data...
                            </div>
                        ) : leaderboard.map((device, i) => {
                            const rep = reputationLabel(device.riskScore);
                            const isPhone = device.deviceId.charCodeAt(0) % 2 === 0;
                            return (
                                <motion.div
                                    key={device.deviceId}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => setSelected(device)}
                                    className="theme-surface-subtle flex cursor-pointer items-center justify-between rounded-xl p-3 transition"
                                    style={{ borderColor: selected?.deviceId === device.deviceId ? 'var(--surface-border-strong)' : undefined }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="theme-muted-text w-4 text-xs font-black">#{i + 1}</span>
                                        {isPhone ? <Smartphone className="theme-muted-text" size={14} /> : <Laptop className="theme-muted-text" size={14} />}
                                        <div>
                                            <p className="theme-strong-text text-xs font-bold">{device.deviceId.substring(0, 18)}...</p>
                                            <p className="theme-muted-text text-[10px]">{device.accounts.size} account{device.accounts.size !== 1 ? 's' : ''} · {device.txCount} tx</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase ${rep.tone === 'danger'
                                            ? 'theme-status-chip-danger'
                                            : rep.tone === 'warning'
                                                ? 'theme-status-chip-warning'
                                                : 'theme-status-chip-success'}`}
                                    >
                                        {rep.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Reputation Engine / Detail Panel */}
                <div className="theme-surface-card h-96 p-6 flex flex-col">
                    <h3 className="theme-stat-label mb-4">Device Reputation Engine</h3>
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {selected ? (
                                <motion.div
                                    key={selected.deviceId}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="theme-mono theme-muted-text truncate text-xs">{selected.deviceId}</p>
                                        <button
                                            onClick={() => setSelected(null)}
                                            className="theme-btn-ghost h-7 w-7 p-0 text-xs"
                                            aria-label="Clear selected device"
                                        >
                                            x
                                        </button>
                                    </div>

                                    {/* Risk Score Ring */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative flex items-center justify-center w-20 h-20">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                                                <circle
                                                    cx="40"
                                                    cy="40"
                                                    r="34"
                                                    fill="none"
                                                    stroke="color-mix(in srgb, var(--surface-border) 85%, transparent)"
                                                    strokeWidth="8"
                                                />
                                                <circle
                                                    cx="40" cy="40" r="34"
                                                    fill="none"
                                                    stroke={selected.riskScore >= 75 ? 'var(--status-danger)' : selected.riskScore >= 40 ? 'var(--status-warning)' : 'var(--status-success)'}
                                                    strokeWidth="8"
                                                    strokeDasharray={`${2 * Math.PI * 34 * selected.riskScore / 100} ${2 * Math.PI * 34}`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="theme-strong-text text-lg font-black">{selected.riskScore}</span>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between gap-8">
                                                <span className="theme-muted-text font-bold">Total Transactions</span>
                                                <span className="theme-strong-text font-black">{selected.txCount}</span>
                                            </div>
                                            <div className="flex justify-between gap-8">
                                                <span className="theme-muted-text font-bold">Fraud Hits</span>
                                                <span className="font-black" style={{ color: 'var(--status-danger)' }}>{selected.fraudCount}</span>
                                            </div>
                                            <div className="flex justify-between gap-8">
                                                <span className="theme-muted-text font-bold">Linked Accounts</span>
                                                <span className="font-black" style={{ color: selected.accounts.size > 3 ? 'var(--status-danger)' : 'var(--app-text-strong)' }}>
                                                    {selected.accounts.size}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="flex items-center gap-2 rounded-xl border p-3 text-xs font-bold"
                                        style={selected.riskScore >= 75
                                            ? {
                                                borderColor: 'color-mix(in srgb, var(--status-danger) 36%, transparent)',
                                                background: 'color-mix(in srgb, var(--status-danger) 12%, transparent)',
                                                color: 'var(--status-danger)'
                                            }
                                            : selected.riskScore >= 40
                                                ? {
                                                    borderColor: 'color-mix(in srgb, var(--status-warning) 36%, transparent)',
                                                    background: 'color-mix(in srgb, var(--status-warning) 12%, transparent)',
                                                    color: 'var(--status-warning)'
                                                }
                                                : {
                                                    borderColor: 'color-mix(in srgb, var(--status-success) 36%, transparent)',
                                                    background: 'color-mix(in srgb, var(--status-success) 12%, transparent)',
                                                    color: 'var(--status-success)'
                                                }}
                                    >
                                        {selected.riskScore >= 40
                                            ? <AlertTriangle size={14} />
                                            : <CheckCircle size={14} />}
                                        {selected.riskScore >= 75
                                            ? 'High-risk device — linked to multiple fraud events'
                                            : selected.riskScore >= 40
                                                ? 'Suspicious device — elevated fraud association'
                                                : 'Trusted device — low fraud rate'}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-full text-center"
                                >
                                    <ShieldAlert className="mb-4 theme-muted-text" size={42} />
                                    <span className="theme-muted-text text-sm font-black uppercase tracking-widest">Select a Device</span>
                                    <p className="theme-muted-text mt-2 text-xs">Click a row to see its reputation analysis</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Device Intelligence Section */}
            <div>
                <h2 className="theme-stat-label mb-4">Device Intelligence Profiles</h2>
                <DeviceIntelligencePanel devices={deviceIntelligence || []} />
            </div>
        </div>
    );
};
