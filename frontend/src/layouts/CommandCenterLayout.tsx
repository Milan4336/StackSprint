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

export const CommandCenterLayout = () => {
    const { isExecutiveMode, toggleExecutiveMode } = useUiStore();
    const logout = useAuthStore((state) => state.logout);
    const connectThreatSocket = useThreatStore((state) => state.connectThreatSocket);

    // Mock user for the dashboard UI since auth store only manages the JWT token
    const user = { email: 'admin@fraud.cmd', role: 'admin' };

    // Connect threat socket on mount
    useEffect(() => {
        connectThreatSocket();
    }, [connectThreatSocket]);

    return (
        <div className="flex h-screen w-full overflow-hidden text-slate-200 relative">
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

            {/* Sidebar */}
            <LeftNav />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Topbar */}
                <header className="shrink-0 bg-[#0b1629]/80 backdrop-blur-md border-b border-slate-800/50 z-10">
                    {/* Threat Level bar (2px progress) */}
                    <ThreatLevelBar />

                    <div className="h-16 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-black uppercase tracking-widest text-slate-100">
                                Fraud Command Center <span className="text-blue-500 ml-2">V3</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* ML Activity */}
                            <MLActivityIndicator />

                            {/* Threat Level Indicator */}
                            <ThreatLevelIndicator />

                            {/* Executive Toggle */}
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-800/50">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Exec Mode
                                </span>
                                <button
                                    onClick={toggleExecutiveMode}
                                    className={`relative h-6 w-11 rounded-full transition-colors ${isExecutiveMode ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                >
                                    <div
                                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isExecutiveMode ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>

                            {/* Audio Toggle */}
                            <div className="flex items-center gap-2 pl-4 border-l border-slate-800/50">
                                <button
                                    onClick={() => useUiStore.getState().toggleAudio()}
                                    className={`p-2 rounded-lg transition-colors ${useUiStore(s => s.isAudioEnabled) ? 'bg-blue-500/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                                    title="Toggle Threat Audio"
                                >
                                    {useUiStore(s => s.isAudioEnabled) ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                </button>
                            </div>

                            {/* User Profile */}
                            <div className="flex items-center gap-4 pl-4 border-l border-slate-800/50">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold text-white leading-none">{user?.email}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-1">
                                        {user?.role}
                                    </p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                                    {user?.role === 'admin' ? (
                                        <Bot size={16} className="text-blue-400" />
                                    ) : (
                                        <User size={16} className="text-blue-400" />
                                    )}
                                </div>
                                <button
                                    onClick={logout}
                                    className="text-slate-500 hover:text-red-400 transition-colors"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 modern-scrollbar relative">
                    <div className="max-w-[1600px] mx-auto w-full relative z-10">
                        <Outlet />
                    </div>
                </main>

                {/* Fixed bottom status bar */}
                <SystemStatusBar />
            </div>
        </div>
    );
};
