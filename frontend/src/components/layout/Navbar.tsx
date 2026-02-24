import { useMemo } from 'react';
import { formatSafeDate } from '../../utils/date';

interface NavbarProps {
  onToggleTheme: () => void;
  onLogout: () => void;
  lastUpdated: string | null;
  theme: 'light' | 'dark';
}

const decodeEmail = (): string => {
  const token = localStorage.getItem('token');
  if (!token) return 'Unknown User';

  try {
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return 'Unknown User';
    const parsed = JSON.parse(atob(payload)) as { email?: string };
    return parsed.email ?? 'Unknown User';
  } catch {
    return 'Unknown User';
  }
};

export const Navbar = ({ onToggleTheme, onLogout, lastUpdated, theme }: NavbarProps) => {
  const email = useMemo(() => decodeEmail(), []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/70">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <p className="chip mb-1 border-blue-500/40 bg-blue-500/10 text-blue-200">Fintech Intelligence Grid</p>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Fraud Detection Command Center
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
            {lastUpdated ? `Last sync ${formatSafeDate(lastUpdated)}` : 'Awaiting first sync'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 md:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live
          </span>
          <p className="hidden text-xs font-semibold text-slate-600 dark:text-slate-400 md:block">{email}</p>
          <button type="button" onClick={onToggleTheme} className="glass-btn">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
