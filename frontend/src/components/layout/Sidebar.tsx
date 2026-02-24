import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
}

const menu = [
  { label: 'Dashboard', to: '/dashboard', icon: '⌂' },
  { label: 'Transactions', to: '/transactions', icon: '◫' },
  { label: 'Analytics', to: '/analytics', icon: '◍' },
  { label: 'Settings', to: '/settings', icon: '⚙' }
];

export const Sidebar = ({ onLogout }: SidebarProps) => {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-slate-800/70 dark:bg-[#07101f]/95 lg:block">
      <div className="mb-8 rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/15 to-white/70 p-3 shadow-xl dark:border-blue-500/25 dark:from-blue-600/20 dark:to-slate-900/60">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700 dark:text-blue-200">Fraud OS</p>
        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Operator Console</p>
      </div>

      <nav className="space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
                isActive
                  ? 'bg-blue-500/15 text-blue-700 ring-1 ring-blue-400/30 shadow-[0_0_0_1px_rgba(59,130,246,0.2)] dark:bg-blue-600/20 dark:text-blue-100'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
              ].join(' ')
            }
          >
            <span className="inline-grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-8 w-full rounded-lg border border-red-500/35 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
      >
        Logout
      </button>
    </aside>
  );
};
