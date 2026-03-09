import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    ListRestart,
    BrainCircuit,
    Network,
    Map,
    MonitorSmartphone,
    BellRing,
    ShieldAlert,
    PlayCircle,
    ActivitySquare,
    PanelLeftClose,
    PanelRightClose,
    Newspaper,
    BarChart3,
    Settings,
    Activity
} from 'lucide-react';
import { NavItem } from './NavItem';
import { useUiStore } from '../../store/ui';
import { useUISound } from '../../hooks/useUISound';
import { useThemeStore } from '../../store/themeStore';
import { HUDCorner, HUDScanline } from '../visual/HUDDecorations';

export const LeftNav = () => {
    const { isSidebarCollapsed, toggleSidebar, isExecutiveMode } = useUiStore();
    const { playSound } = useUISound();
    const { theme } = useThemeStore();

    const color = theme === 'neon' ? 'text-purple-400' : theme === 'tactical' ? 'text-emerald-400' : 'text-blue-400';
    const bgColor = theme === 'neon' ? 'bg-purple-500' : theme === 'tactical' ? 'bg-emerald-500' : 'bg-blue-500';
    const fromColor = theme === 'neon' ? 'from-purple-400' : theme === 'tactical' ? 'from-emerald-400' : 'from-blue-400';
    const viaColor = theme === 'neon' ? 'via-purple-200' : theme === 'tactical' ? 'via-emerald-200' : 'via-blue-200';

    const items = [
        { to: '/dashboard/overview', icon: LayoutDashboard, label: 'Tactical Overview' },
        { to: '/dashboard/transactions', icon: ListRestart, label: 'Live Stream', hideExecutive: true },
        { to: '/dashboard/investigation', icon: Network, label: 'Neural Workspace', hideExecutive: true },
        { to: '/dashboard/geo', icon: Map, label: 'Geo-Threat Matrix' },
        { to: '/dashboard/alerts', icon: ShieldAlert, label: 'Defense Center', hideExecutive: false },
        { to: '/dashboard/analytics', icon: BarChart3, label: 'Predictive Analytics' },
        { to: '/dashboard/simulation', icon: PlayCircle, label: 'War Room' },
        { to: '/dashboard/system', icon: ActivitySquare, label: 'System Vitals', hideExecutive: true },
        { to: '/dashboard/settings', icon: Settings, label: 'Global Config' },
    ];

    const handleToggle = () => {
        playSound('CLICK');
        toggleSidebar();
    };

    const visibleItems = items.filter(item => !(isExecutiveMode && item.hideExecutive));

    return (
        <motion.aside
            initial={false}
            animate={{ width: isSidebarCollapsed ? 80 : 280 }}
            className="flex flex-col h-full cyber-panel border-r border-white/5 shrink-0 relative z-30 overflow-hidden"
        >
            <HUDScanline />
            {/* Nav Header */}
            <div className="flex h-16 items-center px-6 shrink-0 border-b border-white/5 justify-between">
                {!isSidebarCollapsed && (
                    <div className="flex flex-col">
                        <span className={`text-xs font-black uppercase tracking-[0.4em] bg-gradient-to-r ${fromColor} ${viaColor} bg-clip-text text-transparent`}>
                            FRAUD.CMD
                        </span>
                        <span className={`text-[8px] font-mono ${color} opacity-40 uppercase tracking-[0.2em] -mt-1 font-black`}>
                            Intel Core v4.0.5
                        </span>
                    </div>
                )}
                <button
                    onClick={handleToggle}
                    className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                >
                    {isSidebarCollapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 modern-scrollbar">
                {visibleItems.map(item => (
                    <NavItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        label={item.label}
                        isCollapsed={isSidebarCollapsed}
                    />
                ))}
            </div>

            {/* Status Indicator Footnote */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <div className={`relative overflow-hidden rounded-lg border border-white/5 p-3 transition-all duration-500
                    ${isSidebarCollapsed ? 'flex justify-center' : ''}`}
                >
                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                    {isSidebarCollapsed ? (
                        <Activity className={`${theme === 'tactical' ? 'text-blue-400' : 'text-emerald-500'}`} size={18} />
                    ) : (
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="relative">
                                <Activity className={`${theme === 'tactical' ? 'text-blue-400' : 'text-emerald-500'}`} size={18} />
                                <div className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${theme === 'tactical' ? 'bg-blue-400' : 'bg-emerald-500'} animate-ping opacity-75`} />
                            </div>
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-500 leading-none">Security_Core</p>
                                <p className={`text-[11px] font-black ${theme === 'tactical' ? 'text-blue-400' : 'text-emerald-400'} mt-1 uppercase tracking-wider`}>NOMINAL_LOAD</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
};
