import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Circle,
  LogOut,
  MoonStar,
  Search,
  SunMedium,
  UserCircle2
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../../api/client';
import { useDashboardStore } from '../../store/dashboard';
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
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const alerts = useDashboardStore((state) => state.alerts);
  const activeAlerts = alerts.filter((alert) => alert.status !== 'resolved').length;

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(search.trim());
    }, 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const mlStatusQuery = useQuery({
    queryKey: ['system', 'ml-status'],
    queryFn: () => monitoringApi.getMlStatus(),
    refetchInterval: 7000
  });

  const searchQuery = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: () => monitoringApi.globalSearch(debounced),
    enabled: debounced.length >= 2
  });
  const systemQuery = useQuery({
    queryKey: ['system', 'health', 'navbar'],
    queryFn: () => monitoringApi.getSystemHealth(),
    refetchInterval: 10000
  });

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const mlStatus = mlStatusQuery.data?.status ?? 'OFFLINE';
  const systemHealthy = Boolean(
    systemQuery.data &&
      systemQuery.data.mongoStatus === 'UP' &&
      systemQuery.data.redisStatus === 'UP' &&
      systemQuery.data.mlStatus === 'UP'
  );
  const mlTone =
    mlStatus === 'HEALTHY'
      ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      : mlStatus === 'DEGRADED'
      ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
      : 'text-red-300 border-red-500/30 bg-red-500/10';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/55 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/55">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-[220px]">
          <p className="chip mb-1 border-blue-500/35 bg-blue-500/10 text-blue-200">Enterprise Risk Intelligence</p>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[1.65rem]">
            Fraud Detection Command Center
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
            {lastUpdated ? `Last sync ${formatSafeDate(lastUpdated)}` : 'Awaiting first sync'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="relative hidden md:block" ref={searchRef}>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search transactions, users, alerts, cases..."
              className="input w-[25rem] py-2 pl-9"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <AnimatePresence>
              {searchOpen && debounced.length >= 2 && searchQuery.data ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-11 z-40 max-h-[28rem] w-[32rem] overflow-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95"
                >
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Global Search</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Transactions</p>
                      <div className="space-y-1">
                        {searchQuery.data.transactions.slice(0, 4).map((item) => (
                          <Link
                            key={item.transactionId}
                            to={`/transactions`}
                            onClick={() => setSearchOpen(false)}
                            className="block rounded-lg px-2 py-1.5 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {item.transactionId} • {item.userId} • {item.location}
                          </Link>
                        ))}
                        {searchQuery.data.transactions.length === 0 ? (
                          <p className="px-2 text-slate-500">No transaction results.</p>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Alerts</p>
                      <div className="space-y-1">
                        {searchQuery.data.alerts.slice(0, 3).map((item) => (
                          <Link
                            key={item.alertId}
                            to="/alerts"
                            onClick={() => setSearchOpen(false)}
                            className="block rounded-lg px-2 py-1.5 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {item.alertId} • {item.userId} • {item.riskLevel}
                          </Link>
                        ))}
                        {searchQuery.data.alerts.length === 0 ? <p className="px-2 text-slate-500">No alert results.</p> : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Users</p>
                        {searchQuery.data.users.slice(0, 2).map((item) => (
                          <Link
                            key={`${item.email}-${item.role}`}
                            to="/settings"
                            onClick={() => setSearchOpen(false)}
                            className="mt-1 block truncate rounded px-1 py-0.5 text-xs text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {item.email}
                          </Link>
                        ))}
                        {searchQuery.data.users.length === 0 ? (
                          <p className="mt-1 text-xs text-slate-500">No users</p>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Cases</p>
                        {searchQuery.data.cases.slice(0, 2).map((item) => (
                          <Link
                            key={item.caseId}
                            to="/cases"
                            onClick={() => setSearchOpen(false)}
                            className="mt-1 block truncate rounded px-1 py-0.5 text-xs text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {item.caseId}
                          </Link>
                        ))}
                        {searchQuery.data.cases.length === 0 ? (
                          <p className="mt-1 text-xs text-slate-500">No cases</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <span className={`hidden items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold md:inline-flex ${mlTone}`}>
            <span
              className={[
                'h-2 w-2 rounded-full',
                mlStatus === 'HEALTHY' ? 'bg-emerald-400' : mlStatus === 'DEGRADED' ? 'bg-amber-400' : 'bg-red-400'
              ].join(' ')}
            />
            ML {mlStatus}
          </span>

          <span
            className={[
              'hidden items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold md:inline-flex',
              systemHealthy
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            ].join(' ')}
          >
            <Circle size={10} className={systemHealthy ? 'fill-emerald-400 text-emerald-400' : 'fill-amber-400 text-amber-400'} />
            System {systemHealthy ? 'Healthy' : 'Degraded'}
          </span>

          <button
            type="button"
            className="glass-btn relative h-10 w-10 justify-center p-0"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {activeAlerts > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {activeAlerts > 99 ? '99+' : activeAlerts}
              </span>
            ) : null}
          </button>

          <button type="button" onClick={onToggleTheme} className="glass-btn h-10 w-10 justify-center p-0" aria-label="Toggle theme">
            {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="glass-btn h-10 gap-2 pl-2 pr-3"
            >
              <UserCircle2 size={18} />
              <span className="hidden max-w-40 truncate text-xs font-semibold md:inline">{email}</span>
            </button>

            <AnimatePresence>
              {profileOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900/95"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Signed in as</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{email}</p>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/25"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
