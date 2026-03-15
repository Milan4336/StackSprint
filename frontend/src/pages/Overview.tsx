import { useEffect, useState } from 'react';
import { AlertTriangle, Activity, Zap, ShieldAlert, Cpu, FileText } from 'lucide-react';
import { useDashboardOverviewSlice } from '../store/slices/dashboardOverviewSlice';
import { useUiStore } from '../store/ui';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { TransactionVolumeChart } from '../components/dashboard/TransactionVolumeChart';
import { FraudExplanationPanel } from '../components/dashboard/FraudExplanationPanel';
import { VelocityChart } from '../components/dashboard/VelocityChart';
import { TransactionStream } from '../components/transactions/TransactionStream';
import { useThreatStore } from '../store/threatStore';
import { HUDPanel, HUDDataReadout } from '../components/visual/HUDDecorations';
import { IsolationPanel } from '../components/dashboard/IsolationPanel';
import { FraudResponseLog } from '../components/dashboard/FraudResponseLog';
import { AdminControlPanel } from '../components/dashboard/AdminControlPanel';
import { DeviceIntelligencePanel } from '../components/dashboard/DeviceIntelligencePanel';

const threatLevelColor = (index: number) => {
    if (index >= 86) return { text: 'var(--status-danger)', label: 'Critical', bar: 'linear-gradient(90deg, color-mix(in srgb, var(--status-danger) 85%, black 15%), color-mix(in srgb, var(--status-danger) 70%, white 30%))' };
    if (index >= 66) return { text: 'var(--status-warning)', label: 'High', bar: 'linear-gradient(90deg, color-mix(in srgb, var(--status-warning) 80%, black 20%), color-mix(in srgb, var(--status-warning) 75%, white 25%))' };
    if (index >= 41) return { text: 'var(--accent-strong)', label: 'Elevated', bar: 'linear-gradient(90deg, var(--accent), var(--accent-strong))' };
    return { text: 'var(--status-success)', label: 'Normal', bar: 'linear-gradient(90deg, color-mix(in srgb, var(--status-success) 80%, black 20%), color-mix(in srgb, var(--status-success) 75%, white 25%))' };
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

    const { isExecutiveMode } = useUiStore();
    const liveThreatIndex = useThreatStore((state) => state.threatIndex);
    const [fraudCount, setFraudCount] = useState(0);

    // Part 1 — dashboard overview API with refetchInterval
    const { data: overview } = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: () => monitoringApi.getDashboardOverview(),
        refetchInterval: 5000,
        retry: 2,
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

            // Sync API threat index to store so visual enhancers (border glow) fire immediately
            useThreatStore.getState().setThreatIndex(overview.threatIndex);
        }
    }, [overview, setOverviewData]);

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    // Use live socket data when available, fall back to API snapshot
    const threatIndex = liveThreatIndex || overview?.threatIndex || 0;
    const txCount = overview?.transactionCount ?? socketTxCount;
    const alertCount = overview?.alertCount ?? socketAlertCount;
    const tl = threatLevelColor(threatIndex);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <span className="page-kicker">Command Layer</span>
                    <h1 className="theme-page-title italic">
                        Mission <span style={{ color: 'var(--accent)' }}>Control</span>
                    </h1>
                    <div className="flex gap-4 mt-1">
                        <HUDDataReadout label="System Mode" value="Active Intelligence" />
                        <HUDDataReadout label="Security Protocol" value="Elite-v3.7" />
                        <HUDDataReadout label="Telemetry" value="Real-time / Socket-Bound" />
                    </div>
                </div>
                <div
                    className="glass-panel flex items-center gap-3 rounded-xl border px-6 py-3"
                    style={{
                        background: 'color-mix(in srgb, var(--accent) 10%, var(--surface-1) 90%)',
                        borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)'
                    }}
                >
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                        <div className="relative flex h-3 w-3">
                            {connected ? (
                                <>
                                    <motion.span
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inline-flex h-full w-full rounded-full"
                                        style={{ background: 'var(--status-success)' }}
                                    />
                                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--status-success)', boxShadow: '0 0 10px color-mix(in srgb, var(--status-success) 80%, transparent)' }} />
                                </>
                            ) : (
                                <>
                                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: 'var(--status-danger)' }} />
                                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--status-danger)', boxShadow: '0 0 10px color-mix(in srgb, var(--status-danger) 80%, transparent)' }} />
                                </>
                            )}
                        </div>
                        <span style={{ color: connected ? 'var(--status-success)' : 'var(--status-danger)' }}>
                            {connected ? 'Neural Link Established' : 'Attempting Engine Handshake...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* KPI Row — 3 panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI 1: Transaction Volume */}
                <HUDPanel title="Total Transactions">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                        <Activity size={100} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-3">
                            <span className="theme-strong-text text-6xl font-black italic tracking-tighter tabular-nums" style={{ textShadow: '0 0 15px color-mix(in srgb, var(--accent) 50%, transparent)' }}>
                                {txCount.toLocaleString()}
                            </span>
                            <div className="mb-2">
                                <span className="hud-readout border-l pl-2" style={{ borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}>TX / SESSION</span>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4 border-t border-white/5 pt-4">
                            <HUDDataReadout label="Status" value="Processing" />
                            <HUDDataReadout label="Peak" value="Live" />
                            <HUDDataReadout label="Unit" value="Global" />
                        </div>
                    </div>
                </HUDPanel>

                {/* KPI 2: Threat Matrix */}
                <HUDPanel title="Neural Threat Matrix">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                        <Zap size={100} style={{ color: 'var(--status-danger)' }} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-3">
                            <span className="text-6xl font-black italic tracking-tighter tabular-nums" style={{ color: tl.text, textShadow: '0 0 15px color-mix(in srgb, var(--status-danger) 45%, transparent)' }}>
                                {threatIndex.toFixed(0)}
                            </span>
                            <div className="mb-2">
                                <span className="hud-readout border-l pl-2 opacity-100" style={{ color: tl.text, borderColor: 'color-mix(in srgb, var(--status-danger) 35%, transparent)' }}>{tl.label}</span>
                            </div>
                        </div>

                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-sm border relative" style={{ background: 'color-mix(in srgb, var(--surface-3) 75%, transparent)', borderColor: 'var(--surface-border)' }}>
                            <motion.div
                                className="h-full"
                                style={{ background: tl.bar, boxShadow: '0 0 10px color-mix(in srgb, var(--status-danger) 45%, transparent)' }}
                                animate={{ width: `${threatIndex}%` }}
                                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                            />
                        </div>

                        <div className="flex gap-4 mt-4 border-t border-white/5 pt-4">
                            <HUDDataReadout label="Vector" value="ML-Ensemble" />
                            <HUDDataReadout label="Severity" value={tl.label} />
                            <HUDDataReadout label="Bias" value="Active" />
                        </div>
                    </div>
                </HUDPanel>

                {/* KPI 3: Fraud Intelligence */}
                <HUDPanel title="Actionable Intelligence">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                        <ShieldAlert size={100} style={{ color: 'var(--status-warning)' }} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-3">
                            <span
                                className="text-6xl font-black italic tracking-tighter tabular-nums"
                                style={{
                                    color: fraudCount > 0 ? 'var(--status-warning)' : 'var(--app-text-strong)',
                                    textShadow: '0 0 15px color-mix(in srgb, var(--status-warning) 45%, transparent)'
                                }}
                            >
                                {fraudCount}
                            </span>
                            <div className="mb-2">
                                <span className="hud-readout border-l pl-2" style={{ borderColor: 'color-mix(in srgb, var(--status-warning) 35%, transparent)' }}>DETECTED EVENTS</span>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6 border-t border-white/5 pt-4">
                            <HUDDataReadout label="Rate" value={txCount > 0 ? `${((fraudCount / txCount) * 100).toFixed(1)}%` : '0.0%'} />
                            <HUDDataReadout label="Engine" value="Verified" />
                            <HUDDataReadout label="Audit" value="Pending" />
                        </div>
                    </div>
                </HUDPanel>
            </div>



            {
                !isExecutiveMode && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HUDPanel title="Network Throughput">
                                <TransactionVolumeChart transactions={recentTxs || []} />
                            </HUDPanel>
                            <HUDPanel title="Heuristic Explanations">
                                <FraudExplanationPanel transactions={recentTxs || []} explanations={explanations || []} />
                            </HUDPanel>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HUDPanel title="Risk Velocity Vectors">
                                <VelocityChart />
                            </HUDPanel>
                            <HUDPanel title="Live Intelligence Stream">
                                <TransactionStream />
                            </HUDPanel>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <IsolationPanel />
                            <FraudResponseLog />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DeviceIntelligencePanel devices={deviceIntelligence || []} />
                            <AdminControlPanel />
                        </div>
                    </>
                )
            }
        </div >
    );
};
