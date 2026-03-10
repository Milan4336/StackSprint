import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlobalThreatGlobe } from '../components/visual/GlobalThreatGlobe';
import { ShieldAlert, Activity, Crosshair, Target, Tally5 } from 'lucide-react';
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
        <div className="relative h-[calc(100vh-180px)] w-full overflow-hidden bg-[#020617] rounded-3xl border border-slate-800/50 shadow-2xl">
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
                            <div className="h-2 w-8 bg-red-600 animate-pulse" />
                            <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white">
                                Global Threat <span className="text-red-600">Globe</span>
                            </h2>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-11">
                            Real-time Forensic Trajectory Engine // v3.10
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">System Status</p>
                            <div className="flex items-center gap-2 justify-end">
                                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 animate-pulse'}`} />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
                                    {isConnected ? 'Sync Active' : 'Link Loss'}
                                </span>
                            </div>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-800" />
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Global Load</p>
                            <p className="text-xl font-black text-white leading-none">{(threatIndex * 0.8).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>

                {/* Center Section: Crosshairs/Targeting (Static visual) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative h-[500px] w-[500px] border border-red-500/10 rounded-full flex items-center justify-center">
                        <div className="h-[400px] w-[400px] border border-red-500/5 rounded-full" />
                        <div className="h-[300px] w-[300px] border border-red-500/5 rounded-full" />
                        {/* Static Corner Accents */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-[1px] bg-red-500/30" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-8 w-[1px] bg-red-500/30" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-red-500/30" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-red-500/30" />
                    </div>
                </div>

                {/* Sidebar Telemetry (Left) */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 space-y-8 flex flex-col items-start w-48">
                    {[
                        { label: 'Network Depth', val: '4.8ms' },
                        { label: 'Node Entropy', val: '0.428' },
                        { label: 'Dwell Time', val: '18s' }
                    ].map((t, i) => (
                        <div key={i} className="space-y-1 border-l-2 border-slate-800 pl-4 py-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{t.label}</p>
                            <p className="text-sm font-bold text-slate-300 font-mono italic">{t.val}</p>
                        </div>
                    ))}
                    <div className="mt-4 p-3 bg-red-600/5 border border-red-900/40 rounded-lg">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2 flex items-center gap-2">
                            <Target size={12} /> Active Zone
                        </p>
                        <p className="text-[11px] font-bold text-slate-200 uppercase leading-none">US-EAST_CLUSTER_01</p>
                        <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: ['0%', '100%', '0%'] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="h-full bg-red-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Telemetry (Right) */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-8 flex flex-col items-end w-48 text-right">
                    <div className="panel bg-red-950/20 border-red-500/20 w-full py-4 px-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Threat Vector Score</p>
                        <p className="text-4xl font-black text-white italic tracking-tighter">{threatIndex}</p>
                        <div className="mt-2 h-1 w-full bg-red-900/30 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600" style={{ width: `${threatIndex}%` }} />
                        </div>
                    </div>

                    <div className="space-y-4 w-full">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Recent Enforcement</p>
                        {actions.slice(0, 3).map((a, i) => (
                            <div key={i} className="text-[10px] font-bold text-slate-400 font-mono py-1 border-b border-white/5">
                                <span className="text-red-500 mr-2">FIX:</span> {a.action} ({a.userId.slice(0, 6)}...)
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Footer Technical Readouts */}
                <div className="flex justify-between items-end">
                    <div className="flex gap-12">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Atmospheric Sync</p>
                            <p className="text-lg font-black text-white italic tracking-tighter uppercase">STABLE</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Packet Scrutiny</p>
                            <div className="flex gap-1">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className={`h-3 w-1 ${Math.random() > 0.4 ? 'bg-red-600' : 'bg-slate-800'}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 items-center">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Coordinate Sync</p>
                            <p className="text-xs font-mono font-bold text-slate-300">40.7128° N, 74.0060° W</p>
                        </div>
                        <div className="p-4 bg-red-600 animate-pulse rounded-full">
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
