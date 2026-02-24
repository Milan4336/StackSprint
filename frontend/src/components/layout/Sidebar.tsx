import { motion } from 'framer-motion';
import {
  Activity,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Globe,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
}

const menu = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', to: '/transactions', icon: ListChecks },
  { label: 'Alerts', to: '/alerts', icon: ShieldAlert },
  { label: 'Cases', to: '/cases', icon: BellRing },
  { label: 'Fraud Radar', to: '/radar', icon: Globe },
  { label: 'Analytics', to: '/analytics', icon: Gauge },
  { label: 'System Health', to: '/system', icon: Activity },
  { label: 'Settings', to: '/settings', icon: Settings }
];

export const Sidebar = ({ onLogout }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 92 : 282 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="hidden shrink-0 border-r border-slate-200/80 bg-white/45 p-3 backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#061123]/65 lg:block"
    >
      <div className="mb-8 glass-panel overflow-hidden rounded-2xl p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700 dark:text-blue-200">FraudOS</p>
            {!collapsed ? <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Command Center</p> : null}
          </div>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-300 bg-white/70 text-slate-700 transition hover:border-blue-400/60 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-blue-400/60"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        {!collapsed ? (
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/15 to-emerald-500/10 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200">
            Live Fraud Monitoring and Investigation Workspace
          </div>
        ) : null}
      </div>

      <nav className="space-y-1.5">
        {menu.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              [
                'nav-item',
                isActive
                  ? 'bg-blue-500/15 text-blue-700 ring-1 ring-blue-400/35 shadow-[0_0_0_1px_rgba(59,130,246,0.2)] dark:bg-blue-600/20 dark:text-blue-100'
                  : 'text-slate-700 hover:bg-slate-100/85 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <motion.span
                    layoutId="active-sidebar-pill"
                    className="absolute inset-y-1 left-1 w-1 rounded-full bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.7)]"
                  />
                ) : null}
                <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                  <item.icon size={15} />
                </span>
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-8 w-full rounded-xl border border-red-500/35 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/30"
      >
        {collapsed ? '⏻' : 'Sign Out'}
      </button>
    </motion.aside>
  );
};
