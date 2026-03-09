import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { useUISound } from '../../hooks/useUISound';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

interface NavItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
    isCollapsed?: boolean;
}

export const NavItem = ({ to, icon: Icon, label, isCollapsed }: NavItemProps) => {
    const location = useLocation();
    const { playSound } = useUISound();
    const { theme } = useThemeStore();
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

    const color = theme === 'neon' ? 'text-purple-400' : theme === 'tactical' ? 'text-emerald-400' : 'text-blue-400';
    const bgColor = theme === 'neon' ? 'bg-purple-500' : theme === 'tactical' ? 'bg-emerald-500' : 'bg-blue-500';
    const borderColor = theme === 'neon' ? 'border-purple-500' : theme === 'tactical' ? 'border-emerald-500' : 'border-blue-500';
    const shadowColor = theme === 'neon' ? 'rgba(168,85,247,0.3)' : theme === 'tactical' ? 'rgba(16,185,129,0.3)' : 'rgba(14,165,233,0.3)';

    return (
        <Link
            to={to}
            onMouseEnter={() => playSound('HOVER')}
            onClick={() => playSound('CLICK')}
            className={`group relative flex items-center rounded-lg px-3 py-3 transition-all duration-300 ${isActive
                ? `bg-${theme === 'neon' ? 'purple' : theme === 'tactical' ? 'emerald' : 'blue'}-500/10 ${color}`
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                }`}
        >
            {/* Active Glow Indicator */}
            {isActive && (
                <motion.div
                    layoutId="activeNav"
                    className={`absolute inset-0 bg-${theme === 'neon' ? 'purple' : theme === 'tactical' ? 'emerald' : 'blue'}-500/5 border-l-2 ${borderColor}`}
                    style={{ boxShadow: `inset 10px 0 15px -10px ${shadowColor}` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}

            <Icon
                size={isCollapsed ? 22 : 18}
                className={`relative z-10 shrink-0 transition-all duration-300 ${isActive ? `${color}` : 'group-hover:text-blue-300'}`}
                style={isActive ? { filter: `drop-shadow(0 0 8px ${shadowColor})` } : {}}
            />

            {!isCollapsed && (
                <span className={`relative z-10 ml-3 text-xs font-black uppercase tracking-[0.15em] transition-colors ${isActive ? 'text-blue-100' : ''}`}>
                    {label}
                </span>
            )}

            {isCollapsed && (
                <div className="pointer-events-none absolute left-full ml-4 w-max rounded-md border border-white/10 bg-[#0b1629] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-200 opacity-0 shadow-2xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 z-50 backdrop-blur-md">
                    {label}
                </div>
            )}
        </Link>
    );
};
