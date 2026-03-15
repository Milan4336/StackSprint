import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlobalThreatGlobe } from '../components/visual/GlobalThreatGlobe';
import { Crosshair, Target } from 'lucide-react';
import { useActionsSlice } from '../store/slices/actionsSlice';
import { useThreatStore } from '../store/threatStore';

export const AutonomousActions = () => {
    const { actions, connected: isConnected, connectLive, disconnectLive } = useActionsSlice();

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);
    const threatIndex = useThreatStore((state: any) => state.threatIndex);

    return (
        <div
            className="relative h-[calc(100vh-180px)] w-full overflow-hidden rounded-3xl border shadow-2xl"
            style={{
                background: 'color-mix(in srgb, var(--surface-3) 92%, black 8%)',
                borderColor: 'color-mix(in srgb, var(--surface-border) 72%, transparent)'
            }}
        >
            {/* ---- 3D GLOBE LAYER ---- */}
            <div className="absolute inset-0 z-0">
                <GlobalThreatGlobe />
            </div>

            {/* ---- HUD OVERLAY LAYER (Broadcast Design) ---- */}
            <div className="absolute inset-0 z-10 pointer-events-none p-8 flex flex-col justify-between">

                {/* Top Section: Header & Status */}
                <div className="flex justify-between items-start">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="space-y-1"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-8 animate-pulse" style={{ background: 'var(--status-danger)' }} />
                            <h2 className="theme-strong-text text-3xl font-black uppercase tracking-[0.2em]">
                                Global Threat <span style={{ color: 'var(--status-danger)' }}>Globe</span>
                            </h2>
                        </div>
                        <p className="theme-muted-text pl-11 text-[10px] font-bold uppercase tracking-widest">
                            Real-time Forensic Trajectory Engine // v3.10
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="theme-muted-text mb-1 text-[9px] font-black uppercase tracking-widest">System Status</p>
                            <div className="flex items-center gap-2 justify-end">
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${!isConnected ? 'animate-pulse' : ''}`}
                                    style={isConnected
                                        ? {
                                            background: 'var(--status-success)',
                                            boxShadow: '0 0 8px color-mix(in srgb, var(--status-success) 80%, transparent)'
                                        }
                                        : { background: 'var(--status-danger)' }}
                                />
                                <span className="theme-strong-text text-[11px] font-black uppercase tracking-widest">
                                    {isConnected ? 'Sync Active' : 'Link Loss'}
                                </span>
                            </div>
                        </div>
                        <div className="h-10 w-[1px]" style={{ background: 'color-mix(in srgb, var(--surface-border) 75%, transparent)' }} />
                        <div className="text-right">
                            <p className="theme-muted-text mb-1 text-[9px] font-black uppercase tracking-widest">Global Load</p>
                            <p className="theme-strong-text text-xl font-black leading-none">{(threatIndex * 0.8).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>

                {/* Center Section: Crosshairs/Targeting (Static visual) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-[500px] w-[500px] items-center justify-center rounded-full border" style={{ borderColor: 'color-mix(in srgb, var(--status-danger) 18%, transparent)' }}>
                        <div className="h-[400px] w-[400px] rounded-full border" style={{ borderColor: 'color-mix(in srgb, var(--status-danger) 10%, transparent)' }} />
                        <div className="h-[300px] w-[300px] rounded-full border" style={{ borderColor: 'color-mix(in srgb, var(--status-danger) 10%, transparent)' }} />
                        {/* Static Corner Accents */}
                        <div className="absolute left-1/2 top-0 h-8 w-[1px] -translate-x-1/2" style={{ background: 'color-mix(in srgb, var(--status-danger) 35%, transparent)' }} />
                        <div className="absolute bottom-0 left-1/2 h-8 w-[1px] -translate-x-1/2" style={{ background: 'color-mix(in srgb, var(--status-danger) 35%, transparent)' }} />
                        <div className="absolute left-0 top-1/2 h-[1px] w-8 -translate-y-1/2" style={{ background: 'color-mix(in srgb, var(--status-danger) 35%, transparent)' }} />
                        <div className="absolute right-0 top-1/2 h-[1px] w-8 -translate-y-1/2" style={{ background: 'color-mix(in srgb, var(--status-danger) 35%, transparent)' }} />
                    </div>
                </div>

                {/* Sidebar Telemetry (Left) */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 space-y-8 flex flex-col items-start w-48">
                    {[
                        { label: 'Network Depth', val: '4.8ms' },
                        { label: 'Node Entropy', val: '0.428' },
                        { label: 'Dwell Time', val: '18s' }
                    ].map((t, i) => (
                        <div key={i} className="space-y-1 border-l-2 py-1 pl-4" style={{ borderColor: 'color-mix(in srgb, var(--surface-border) 75%, transparent)' }}>
                            <p className="theme-muted-text text-[9px] font-black uppercase tracking-widest">{t.label}</p>
                            <p className="theme-mono theme-strong-text text-sm font-bold italic">{t.val}</p>
                        </div>
                    ))}
                    <div
                        className="mt-4 rounded-lg border p-3"
                        style={{
                            background: 'color-mix(in srgb, var(--status-danger) 8%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--status-danger) 28%, transparent)'
                        }}
                    >
                        <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--status-danger)' }}>
                            <Target size={12} /> Active Zone
                        </p>
                        <p className="theme-strong-text text-[11px] font-bold uppercase leading-none">US-EAST_CLUSTER_01</p>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--surface-3) 92%, transparent)' }}>
                            <motion.div
                                animate={{ width: ['0%', '100%', '0%'] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="h-full"
                                style={{ background: 'var(--status-danger)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Telemetry (Right) */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-8 flex flex-col items-end w-48 text-right">
                    <div
                        className="theme-panel-danger w-full px-6 py-4"
                        style={{ background: 'color-mix(in srgb, var(--status-danger) 12%, transparent)' }}
                    >
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--status-danger)' }}>Threat Vector Score</p>
                        <p className="theme-strong-text text-4xl font-black italic tracking-tighter">{threatIndex}</p>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--status-danger) 20%, transparent)' }}>
                            <div className="h-full" style={{ width: `${threatIndex}%`, background: 'var(--status-danger)' }} />
                        </div>
                    </div>

                    <div className="space-y-4 w-full">
                        <p className="theme-muted-text text-[9px] font-black uppercase tracking-widest">Autonomous Battle Log</p>
                        <div className="h-64 overflow-y-auto theme-panel-dark p-3 rounded-xl border border-white/5 space-y-2 font-mono scrollbar-hide">
                            {actions.map((a, idx) => (
                                <motion.div 
                                    key={`${a.timestamp}-${idx}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-[9px] border-l-2 pl-2 flex flex-col gap-0.5"
                                    style={{ borderColor: a.severity === 'critical' ? 'var(--status-danger)' : 'var(--accent)' }}
                                >
                                    <div className="flex justify-between">
                                        <span className="text-white/40">{new Date(a.timestamp).toLocaleTimeString()}</span>
                                        <span style={{ color: a.severity === 'critical' ? 'var(--status-danger)' : 'var(--accent)' }}>[{a.type.toUpperCase()}]</span>
                                    </div>
                                    <div className="theme-strong-text uppercase tracking-tighter">
                                        {a.action || 'LOCKDOWN_SEQUENCE'}: {a.userId.slice(0, 8)}
                                    </div>
                                    <div className="text-[8px] opacity-50 truncate">STATUS: APPREHENDED // PROTOCOL_ARGUS</div>
                                </motion.div>
                            ))}
                            {actions.length === 0 && (
                                <div className="text-[9px] text-white/20 italic p-4 text-center">Awaiting Live Engagement Data...</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Footer Technical Readouts */}
                <div className="flex justify-between items-end">
                    <div className="flex gap-12">
                        <div className="space-y-1">
                            <p className="theme-muted-text text-[9px] font-black uppercase tracking-widest italic">Atmospheric Sync</p>
                            <p className="theme-strong-text text-lg font-black uppercase italic tracking-tighter">STABLE</p>
                        </div>
                        <div className="space-y-1">
                            <p className="theme-muted-text text-[9px] font-black uppercase tracking-widest italic">Packet Scrutiny</p>
                            <div className="flex gap-1">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={`packet-${i}`}
                                        className="h-3 w-1"
                                        style={{ background: Math.random() > 0.4 ? 'var(--status-danger)' : 'color-mix(in srgb, var(--surface-3) 92%, transparent)' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 items-center">
                        <div className="text-right">
                            <p className="theme-muted-text text-[9px] font-black uppercase tracking-widest">Coordinate Sync</p>
                            <p className="theme-mono theme-strong-text text-xs font-bold">40.7128° N, 74.0060° W</p>
                        </div>
                        <div className="animate-pulse rounded-full p-4" style={{ background: 'var(--status-danger)' }}>
                            <Crosshair size={24} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- DECORATIVE SCANLINES & GRAIN ---- */}
            <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>
    );
};
