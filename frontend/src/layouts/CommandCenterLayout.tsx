import { Outlet } from 'react-router-dom';
import { LeftNav } from '../components/navigation/LeftNav';
import { useUiStore } from '../store/ui';
import { Bot, User, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { SystemStatusBar } from '../components/layout/SystemStatusBar';
import { useEffect } from 'react';
import { useThreatStore } from '../store/threatStore';
import { ThreatAudioEngine } from '../components/visual/ThreatAudioEngine';

// Visual Intelligence Layer
import { ThreatBorderGlow } from '../components/visual/ThreatBorderGlow';
import { ThreatAtmosphere } from '../components/visual/ThreatAtmosphere';
import { SOCGrid } from '../components/visual/SOCGrid';
import { ThreatShockwave } from '../components/visual/ThreatShockwave';
import { DefenseShield } from '../components/visual/DefenseShield';
import { InteractiveNeuralFlow } from '../components/visual/InteractiveNeuralFlow';
import { ThreatPulseOverlay } from '../components/visual/ThreatPulseOverlay';
import { AlertFlashEffect } from '../components/visual/AlertFlashEffect';
import { ThreatLevelBar } from '../components/visual/ThreatLevelBar';
import { MLActivityIndicator } from '../components/visual/MLActivityIndicator';
import { AttackModeOverlay } from '../components/visual/AttackModeOverlay';
import { FraudCopilot } from '../components/intelligence/FraudCopilot';
import { ThreatLevelIndicator } from '../components/threat/ThreatLevelIndicator';
import { useUISound } from '../hooks/useUISound';
import { motion } from 'framer-motion';
import { useThemeStore, ThemeType } from '../store/themeStore';
import { Palette, Layers, Zap } from 'lucide-react';

export const CommandCenterLayout = () => {
    const { isExecutiveMode, toggleExecutiveMode, toggleSidebar } = useUiStore();
    const logout = useAuthStore((state) => state.logout);
    const connectThreatSocket = useThreatStore((state) => state.connectThreatSocket);
    const { playSound } = useUISound();
    const { theme, setTheme } = useThemeStore();

    // Mock user for the dashboard UI
    const user = { email: 'admin@intel.core', role: 'admin' };

    useEffect(() => {
        connectThreatSocket();
    }, [connectThreatSocket]);

    const handleExecToggle = () => {
        playSound('CLICK');
        toggleSidebar(); // Assuming this is what we want, or keep toggleExecutiveMode
        toggleExecutiveMode();
    };

    return (
        <div className="flex h-screen w-full overflow-hidden text-slate-200 relative bg-[#02040a]">
            {/* ---- Visual Intelligence Layer (z-indexed overlays) ---- */}
            <ThreatAtmosphere />
            <SOCGrid />
            <ThreatShockwave />
            <DefenseShield />
            <InteractiveNeuralFlow />
            <ThreatBorderGlow />
            <ThreatPulseOverlay />
            <AlertFlashEffect />
            <AttackModeOverlay />
            <FraudCopilot />
            <ThreatAudioEngine />

            {/* Moving Scanning lines for the whole background */}
            <div className="absolute inset-0 pointer-events-none z-[2]">
                <div className="neon-line-x top-1/4 opacity-10" />
                <div className="neon-line-x top-3/4 opacity-10" />
            </div>

            {/* Sidebar */}
            <LeftNav />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Topbar HUD */}
                <header className="shrink-0 z-20 px-8 py-4">
                    <div className="cyber-panel hud-clipped px-8 h-16 flex items-center justify-between border-white/10">
                        {/* Title Section */}
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <h1 className="text-xl font-black uppercase tracking-[0.3em] bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
                                    CORE.DASHBOARD
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="h-1 w-1 bg-blue-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-mono text-blue-500/50 uppercase tracking-[0.2em]">
                                        Node: Signal-Zulu-9
                                    </span>
                                </div>
                            </div>

                            {/* Threat Level bar integrated into header */}
                            <div className="hidden lg:block w-48 h-12 border-l border-white/5 pl-6">
                                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Global Load</p>
                                <ThreatLevelBar />
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            {/* Theme Switcher */}
                            <div className="flex items-center gap-2 border-l border-white/10 pl-8">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mr-2">Spectral</p>
                                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                    {(['cyber', 'neon', 'tactical'] as ThemeType[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => { setTheme(t); playSound('SCAN'); }}
                                            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${theme === t ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.2)] border border-blue-500/30' : 'text-slate-600 hover:text-slate-400'}`}
                                            title={t.toUpperCase()}
                                        >
                                            {t === 'cyber' && <Layers size={14} />}
                                            {t === 'neon' && <Zap size={14} />}
                                            {t === 'tactical' && <Palette size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ML Activity */}
                            <div className="hidden md:flex items-center gap-4">
                                <MLActivityIndicator />
                                <div className="h-8 w-px bg-white/5" />
                                <ThreatLevelIndicator />
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-center gap-6 border-l border-white/10 pl-8">
                                {/* Executive Toggle HUD Style */}
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Operation</p>
                                        <p className="text-[10px] font-bold text-blue-400 uppercase">{isExecutiveMode ? 'Executive' : 'Tactical'}</p>
                                    </div>
                                    <button
                                        onClick={handleExecToggle}
                                        className={`relative h-6 w-11 rounded-full border border-white/10 transition-all ${isExecutiveMode ? 'bg-blue-600/40 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800/40'}`}
                                    >
                                        <motion.div
                                            animate={{ x: isExecutiveMode ? 20 : 2 }}
                                            className="h-4 w-4 rounded-sm bg-white shadow-lg mt-0.5 ml-0.5"
                                        />
                                    </button>
                                </div>

                                {/* User Profile */}
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden xl:block">
                                        <p className="text-[10px] font-bold text-white leading-none tracking-wider">{user?.email}</p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/60 mt-1">
                                            Clearance: Level 5
                                        </p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        onMouseEnter={() => playSound('HOVER')}
                                        className="h-10 w-10 rounded-lg border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/40 transition-all group"
                                    >
                                        <LogOut size={18} className="text-slate-500 group-hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 modern-scrollbar relative z-10">
                    <div className="max-w-[1800px] mx-auto w-full">
                        <Outlet />
                    </div>
                </main>

                {/* Status Bar */}
                <div className="px-8 pb-4 shrink-0">
                    <SystemStatusBar />
                </div>
            </div>
        </div>
    );
};
