import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, Activity, Zap, ShieldAlert, Cpu, FileText, Globe } from 'lucide-react';
import { useDashboardOverviewSlice } from '../store/slices/dashboardOverviewSlice';
import { useUiStore } from '../store/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { TransactionVolumeChart } from '../components/dashboard/TransactionVolumeChart';
import { FraudExplanationPanel } from '../components/dashboard/FraudExplanationPanel';
import { VelocityChart } from '../components/dashboard/VelocityChart';
import { TransactionStream } from '../components/transactions/TransactionStream';
import { useThreatStore } from '../store/threatStore';
import { HUDCard } from '../components/layout/HUDCard';
import { HolographicIndicator } from '../components/visual/HolographicIndicator';
import { HUDDataReadout } from '../components/visual/HUDDecorations';
import { IsolationPanel } from '../components/dashboard/IsolationPanel';
import { FraudResponseLog } from '../components/dashboard/FraudResponseLog';
import { AdminControlPanel } from '../components/dashboard/AdminControlPanel';
import { DeviceIntelligencePanel } from '../components/dashboard/DeviceIntelligencePanel';
import { useUISound } from '../hooks/useUISound';
import { useThemeStore, ThemeType } from '../store/themeStore';
import { HUDPanel, HUDCorner, HUDScanline } from '../components/visual/HUDDecorations';

const threatLevelColor = (index: number) => {
    if (index >= 86) return { text: 'text-red-400', label: 'CRITICAL THREAT', bar: 'from-red-600 to-red-400', glow: 'rgba(239, 68, 68, 0.4)' };
    if (index >= 66) return { text: 'text-orange-400', label: 'HIGH RISK', bar: 'from-orange-600 to-orange-400', glow: 'rgba(249, 115, 22, 0.4)' };
    if (index >= 41) return { text: 'text-amber-400', label: 'ELEVATED', bar: 'from-amber-500 to-yellow-400', glow: 'rgba(245, 158, 11, 0.4)' };
    return { text: 'text-emerald-400', label: 'NOMINAL', bar: 'from-emerald-600 to-emerald-400', glow: 'rgba(34, 197, 94, 0.4)' };
};

export const Overview = () => {
    const {
        connected,
        transactionCount: socketTxCount,
        alertCount: socketAlertCount,
        connectLive,
        disconnectLive,
        setOverviewData
    } = useDashboardOverviewSlice();

    const isExecutiveMode = useUiStore();
    const liveThreatIndex = useThreatStore((state) => state.threatIndex);
    const { playSound } = useUISound();
    const { theme } = useThemeStore();
    const [fraudCount, setFraudCount] = useState(0);

    const themeColors = useMemo(() => {
        const colors: Record<ThemeType, { primary: string; secondary: string; critical: string; text: string; bg: string }> = {
            cyber: { primary: '#3b82f6', secondary: '#f59e0b', critical: '#ef4444', text: 'text-blue-400', bg: 'bg-blue-500' },
            neon: { primary: '#a855f7', secondary: '#f472b6', critical: '#ef4444', text: 'text-purple-400', bg: 'bg-purple-500' },
            tactical: { primary: '#10b981', secondary: '#facc15', critical: '#3b82f6', text: 'text-emerald-400', bg: 'bg-emerald-500' }
        };
        return colors[theme] || colors.cyber;
    }, [theme]);

    const { data: overview } = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: () => monitoringApi.getDashboardOverview(),
        refetchInterval: 5000,
    });

    const { data: recentTxs } = useQuery({
        queryKey: ['overview-transactions'],
        queryFn: () => monitoringApi.getTransactions(200),
        refetchInterval: 10000
    });

    const { data: explanations } = useQuery({
        queryKey: ['overview-explanations'],
        queryFn: () => monitoringApi.getExplanations(20),
        refetchInterval: 10000
    });

    const { data: deviceIntelligence } = useQuery({
        queryKey: ['overview-device-intelligence'],
        queryFn: () => monitoringApi.getDeviceIntelligence(50),
        refetchInterval: 15000
    });

    useEffect(() => {
        if (overview) {
            setOverviewData(overview);
            setFraudCount(overview.fraudCount ?? 0);
            useThreatStore.getState().setThreatIndex(overview.threatIndex);
        }
    }, [overview, setOverviewData]);

    useEffect(() => {
        connectLive();
        if (connected) playSound('SCAN');
        return () => disconnectLive();
    }, [connectLive, disconnectLive, connected]);

    const threatIndex = liveThreatIndex || overview?.threatIndex || 0;
    const txCount = overview?.transactionCount ?? socketTxCount;
    const tl = threatLevelColor(threatIndex);

    return (
        <div className="space-y-8 pb-10">
            {/* Cinematic Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className={`h-4 w-1 ${themeColors.bg}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${themeColors.text} opacity-60`}>
                            Neural Intelligence Layer
                        </span>
                    </motion.div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic">
                        TACTICAL <span className={`${themeColors.text} bg-gradient-to-r from-slate-200 to-white bg-clip-text text-transparent`}>OVERVIEW</span>
                    </h1>
                </div>

                {/* Connection Status Badge */}
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Telemetry Status</p>
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${connected ? 'text-emerald-400' : 'text-red-500'}`}>
                            {connected ? 'Neural Link Online' : 'Signal Disconnected'}
                        </p>
                    </div>
                    <div className={`h-12 px-6 flex items-center gap-3 rounded-lg border border-white/5 bg-black/40 backdrop-blur-md`}>
                        <div className="relative">
                            <motion.div
                                animate={connected ? { scale: [1, 2, 1], opacity: [1, 0, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-white/50">{connected ? 'STABLE' : 'RETRYING'}</span>
                    </div>
                </div>
            </div>

            {/* Central Intelligence Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
                {/* Left: Holographic Indicator */}
                <div className="flex justify-center py-10 relative">
                    <HolographicIndicator
                        threatIndex={Math.round(threatIndex)}
                        label={tl.label}
                    />
                    {/* Floating HUD Annotations */}
                    <div className="absolute top-0 right-0 p-4 border border-white/5 bg-black/40 rounded-lg flex flex-col gap-1 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <HUDCorner position="top-right" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ensemble Bias</span>
                        <span className={`text-[11px] font-black ${themeColors.text} uppercase tracking-widest`}>+0.0024_CORR</span>
                    </div>
                </div>

                {/* Right: Key Analytics HUD Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="relative">
                        <HUDScanline />
                        <HUDCard title="System Throughput" icon={<Activity size={18} />}>
                            <div className="flex flex-col">
                                <span className="metric-value-huge text-4xl italic">
                                    {txCount.toLocaleString()}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-3">
                                    Total_Inbound_Stream
                                </span>
                                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: '65%' }}
                                        className={`h-full ${themeColors.bg} shadow-[0_0_15px_${themeColors.primary}40]`}
                                    />
                                </div>
                            </div>
                        </HUDCard>
                    </div>

                    <div className="relative">
                        <HUDScanline />
                        <HUDCard title="Anomaly Detection" icon={<ShieldAlert size={18} />}>
                            <div className="flex flex-col">
                                <span className={`metric-value-huge text-4xl italic ${fraudCount > 0 ? 'text-red-500' : ''}`} style={fraudCount > 0 ? { filter: `drop-shadow(0 0 15px ${themeColors.critical}60)` } : {}}>
                                    {fraudCount}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-3">
                                    Positive_Intercepts
                                </span>
                                <div className="mt-4 flex gap-2">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-sm border ${fraudCount > 0 ? 'border-red-500/30 text-red-500 bg-red-500/5' : `border-${themeColors.primary}-500/30 ${themeColors.text} bg-${themeColors.primary}-500/5`}`}>
                                        {txCount > 0 ? ((fraudCount / txCount) * 100).toFixed(2) : '0.00'}% DEVIATION
                                    </span>
                                </div>
                            </div>
                        </HUDCard>
                    </div>
                </div>
            </div>

            {/* Deep Analytics Section */}
            {!isExecutiveMode && (
                <div className="space-y-8 pt-8">
                    <div className="flex items-center gap-4">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500/20 to-transparent" />
                        <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-500">Forensic Intelligence</h2>
                        <div className="h-0.5 flex-1 bg-gradient-to-l from-blue-500/20 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <HUDCard title="Temporal Flux" icon={<Activity size={18} />} delay={0.1}>
                            <TransactionVolumeChart transactions={recentTxs || []} />
                        </HUDCard>
                        <HUDCard title="Logic Traces" icon={<FileText size={18} />} delay={0.2}>
                            <FraudExplanationPanel transactions={recentTxs || []} explanations={explanations || []} />
                        </HUDCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <HUDCard title="Vector Velocity" icon={<Zap size={18} />} delay={0.3}>
                            <VelocityChart />
                        </HUDCard>
                        <HUDCard title="Live Stream Overlay" icon={<Globe size={18} />} delay={0.4}>
                            <TransactionStream />
                        </HUDCard>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <HUDCard title="Isolation Metrics" delay={0.5}>
                            <IsolationPanel />
                        </HUDCard>
                        <HUDCard title="Response Log v2" delay={0.6}>
                            <FraudResponseLog />
                        </HUDCard>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DeviceIntelligencePanel devices={deviceIntelligence || []} />
                        <HUDCard title="Signal Command" delay={0.7}>
                            <AdminControlPanel />
                        </HUDCard>
                    </div>
                </div>
            )}
        </div>
    );
};
