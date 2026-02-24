import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from '../Footer';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';
import { useDashboardStore } from '../../store/dashboard';

export const AppLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const { toggleTheme } = useTheme();
  const { lastUpdated } = useTransactions();
  const loadDashboardData = useDashboardStore((state) => state.loadDashboardData);
  const connectLive = useDashboardStore((state) => state.connectLive);
  const disconnectLive = useDashboardStore((state) => state.disconnectLive);

  useEffect(() => {
    void loadDashboardData();
    connectLive();
    return () => {
      disconnectLive();
    };
  }, [connectLive, disconnectLive, loadDashboardData]);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />
      </div>
      <div className="flex min-h-screen">
        <Sidebar onLogout={logout} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar onToggleTheme={toggleTheme} onLogout={logout} lastUpdated={lastUpdated} />
          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[1500px] space-y-6">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
