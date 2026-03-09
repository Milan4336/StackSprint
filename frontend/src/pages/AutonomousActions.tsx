import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalThreatGlobe } from '../components/visual/GlobalThreatGlobe';
import { ShieldAlert, Activity, Crosshair, Target, Cpu, Terminal, Zap } from 'lucide-react';
import { useActionsSlice } from '../store/slices/actionsSlice';
import { useThreatStore } from '../store/threatStore';
import { HUDPanel, HUDCorner, HUDScanline, HUDDataReadout } from '../components/visual/HUDDecorations';
import { useUISound } from '../hooks/useUISound';
import { useThemeStore } from '../store/themeStore';
import { useMemo } from 'react';

export const AutonomousActions = () => {
    const { actions, connected: isConnected, connectLive, disconnectLive } = useActionsSlice();
    const { playSound } = useUISound();
    const { theme } = useThemeStore();

    const themeColors = useMemo(() => {
        return {
            cyber: { primary: 'text-blue-400', secondary: 'text-blue-500', accent: 'text-red-500', bgAccent: 'bg-red-500', shadow: 'rgba(239,68,68,0.5)', hudBorder: 'border-blue-500/20' },
            neon: { primary: 'text-purple-400', secondary: 'text-purple-500', accent: 'text-pink-500', bgAccent: 'bg-pink-500', shadow: 'rgba(244,114,182,0.5)', hudBorder: 'border-purple-500/20' },
            tactical: { primary: 'text-emerald-400', secondary: 'text-emerald-500', accent: 'text-blue-500', bgAccent: 'bg-blue-500', shadow: 'rgba(59,130,246,0.5)', hudBorder: 'border-emerald-500/20' }
        }[theme] || { primary: 'text-blue-400', secondary: 'text-blue-500', accent: 'text-red-500', bgAccent: 'bg-red-500', shadow: 'rgba(239,68,68,0.5)', hudBorder: 'border-blue-500/20' };
    }, [theme]);

    useEffect(() => {
        connectLive();
        if (isConnected) playSound('SCAN');
        return () => disconnectLive();
    }, [connectLive, disconnectLive, isConnected]);

    const threatIndex = useThreatStore((state: any) => state.threatIndex);

    return (
        <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden rounded-lg border border-white/5 bg-black/40 shadow-2xl">
            {/* ---- 3D GLOBE LAYER ---- */}
            <div className="absolute inset-0 z-0">
                <GlobalThreatGlobe />
            </div>

            {/* ---- HUD OVERLAY LAYER ---- */}
            <div className="absolute inset-0 z-10 pointer-events-none p-10 flex flex-col justify-between">

                {/* Top Section: Header & System Telemetry */}
                <div className="flex justify-between items-start">
                    <motion.div
                        initial={{ x: -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-6 w-1 ${themeColors.bgAccent} shadow-[0_0_15px_${themeColors.shadow}]`} />
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                                THREAT <span className={`${themeColors.accent} bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent`}>MANIFEST</span>
                            </h2>
                        </div>
                        <div className="flex items-center gap-4 pl-5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                                Global_Interceptor_Array_v4.2.1
                            </span>
                            <div className="h-px w-24 bg-white/10" />
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-8 pointer-events-auto">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Neural_Link</p>
                            <div className="flex items-center gap-3 justify-end bg-black/40 px-4 py-2 rounded-sm border border-white/5">
                                <motion.div
                                    animate={isConnected ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}
                                />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">
                                    {isConnected ? 'ESTABLISHED' : 'LINK_LOSS'}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Load_Factor</p>
                            <div className="bg-black/40 px-4 py-2 rounded-sm border border-white/5">
                                <p className="text-2xl font-black text-white italic tabular-nums leading-none">
                                    {(threatIndex * 0.8).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Section: Tactical Crosshair Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative h-[600px] w-[600px] flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className={`absolute inset-0 border border-${themeColors.secondary.replace('-500', '')}-500/10 rounded-full border-dashed`}
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                            className={`absolute inset-[15%] border border-${themeColors.accent.replace('text-', '').replace('pink-500', 'pink')}-500/5 rounded-full border-dashed`}
                        />

                        {/* Interactive HUD Markers */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-12 w-[1px] bg-red-500/40" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-12 w-[1px] bg-red-500/40" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-[1px] bg-red-500/40" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-[1px] bg-red-500/40" />
                    </div>
                </div>

                {/* Left Telemetry Sidebar */}
                <div className="absolute left-10 top-1/2 -translate-y-1/2 space-y-8 flex flex-col items-start w-56 pointer-events-auto">
                    <div className={`hud-panel !bg-black/60 ${themeColors.hudBorder} p-4 w-full`}>
                        <HUDCorner position="top-left" />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${themeColors.primary} mb-4 block flex items-center gap-2`}>
                            <Activity size={12} /> Live_Telemetry
                        </span>
                        <div className="space-y-4">
                            <HUDDataReadout label="Atmosphere_Sync" value="STABLE" />
                            <HUDDataReadout label="Latency_Node" value="0.4ms" />
                            <HUDDataReadout label="Entropy_Coef" value="0.92" />
                        </div>
                    </div>

                    <div className={`hud-panel !bg-${themeColors.accent.replace('text-', '')}/5 border-${themeColors.accent.replace('text-', '')}/20 p-4 w-full`}>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${themeColors.accent} mb-4 block flex items-center gap-2`}>
                            <Target size={12} /> Active_Focus
                        </span>
                        <p className="text-sm font-bold text-white uppercase tracking-wider">EUR-WEST_NODE_92</p>
                        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: ['20%', '90%', '20%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className={`h-full ${themeColors.bgAccent} shadow-[0_0_8px_${themeColors.shadow}]`}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Analytics Sidebar */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 space-y-8 flex flex-col items-end w-64 pointer-events-auto text-right">
                    <div className={`hud-panel !bg-black/60 border-${themeColors.accent.replace('text-', '')}/20 p-6 w-full shadow-[0_0_40px_${themeColors.shadow.replace('0.5', '0.05')}]`}>
                        <HUDCorner position="top-right" />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${themeColors.accent} mb-3 block`}>Global_Risk_Index</span>
                        <div className="flex items-end justify-between">
                            <p className="text-6xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                {threatIndex}
                            </p>
                            <div className="flex flex-col gap-1 pb-2">
                                <span className={`text-[9px] font-black ${themeColors.accent}`}>STATUS: CRITICAL</span>
                                <div className={`h-1 w-12 ${themeColors.bgAccent}/40 rounded-full`} />
                            </div>
                        </div>
                    </div>

                    <div className="hud-panel !bg-black/40 border-white/5 p-4 w-full">
                        <HUDScanline />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Engine_Directives</span>
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {actions.slice(0, 4).map((a, i) => (
                                    <motion.div
                                        key={a.id || i}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[10px] font-bold text-slate-300 font-mono py-2 border-b border-white/5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Zap size={10} className={`${themeColors.accent}`} />
                                            <span>{a.action}</span>
                                        </div>
                                        <span className="text-slate-500 opacity-60">[{a.userId.slice(0, 4)}]</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar Section */}
                <div className="flex justify-between items-end relative z-10 p-2 bg-gradient-to-t from-black/80 to-transparent -mx-10 -mb-10 px-10 pb-8 border-t border-white/5">
                    <div className="flex gap-16">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Temporal_Drift</p>
                            <div className="flex items-baseline gap-3">
                                <p className="text-2xl font-black text-blue-400 italic tracking-tighter">0.02</p>
                                <span className="text-[10px] text-slate-600 font-mono">MS/PS</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Signal_Density</p>
                            <div className="flex gap-1.5 items-end h-8">
                                {[...Array(24)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [12, Math.random() * 24 + 8, 12] }}
                                        transition={{ duration: 1.5 + Math.random(), repeat: Infinity }}
                                        className={`w-1 rounded-sm ${i % 5 === 0 ? themeColors.bgAccent : `${themeColors.secondary}/40`}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-8 items-center pointer-events-auto">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Grid_Coords</p>
                            <p className="text-xs font-mono font-bold text-white/60 tracking-wider font-bold italic">40.7128°N 74.0060°W</p>
                        </div>
                        <button
                            className={`p-5 ${themeColors.bgAccent} hover:opacity-80 shadow-[0_0_25px_${themeColors.shadow}] rounded-sm transition-all active:scale-95 group relative`}
                            onClick={() => playSound('SCAN')}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-ping rounded-sm opacity-20 pointer-events-none" />
                            <Target size={28} className="text-white relative z-10" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Matrix Overlay Rain Enhancement */}
            <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(2,6,23,0.8)_100%)]" />
        </div>
    );
};
