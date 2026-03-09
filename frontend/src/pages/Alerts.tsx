import { useEffect, useState } from 'react';
import { monitoringApi } from '../api/client';
import { AlertRecord } from '../types';
import { AlertCard } from '../components/alerts/AlertCard';
import { Bell, ShieldAlert, Filter, CheckCircle2, RefreshCw, Activity, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HUDCard } from '../components/layout/HUDCard';
import { HUDPanel, HUDDataReadout, HUDCorner, HUDScanline } from '../components/visual/HUDDecorations';
import { useUISound } from '../hooks/useUISound';
import { useThemeStore } from '../store/themeStore';
import { useMemo } from 'react';

export const Alerts = () => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CRITICAL'>('ALL');
  const { playSound } = useUISound();
  const { theme } = useThemeStore();

  const themeColors = useMemo(() => {
    return {
      cyber: { primary: 'text-blue-400', accent: 'text-red-500', bgAccent: 'bg-red-500', borderHighlight: 'border-red-500', filterActive: 'bg-red-600', filterShadow: 'rgba(239,68,68,0.4)', iconColor: 'text-blue-400' },
      neon: { primary: 'text-purple-400', accent: 'text-pink-500', bgAccent: 'bg-pink-500', borderHighlight: 'border-pink-500', filterActive: 'bg-purple-600', filterShadow: 'rgba(168,85,247,0.4)', iconColor: 'text-purple-400' },
      tactical: { primary: 'text-emerald-400', accent: 'text-blue-500', bgAccent: 'bg-blue-500', borderHighlight: 'border-blue-500', filterActive: 'bg-emerald-600', filterShadow: 'rgba(16,185,129,0.4)', iconColor: 'text-emerald-400' }
    }[theme] || { primary: 'text-blue-400', accent: 'text-red-500', bgAccent: 'bg-red-500', borderHighlight: 'border-red-500', filterActive: 'bg-red-600', filterShadow: 'rgba(239,68,68,0.4)', iconColor: 'text-blue-400' };
  }, [theme]);

  const fetchAlerts = async () => {
    try {
      const data = await monitoringApi.getLiveAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const handleNewAlert = (e: any) => {
      setAlerts(prev => [e.detail, ...prev].slice(0, 50));
    };

    window.addEventListener('fraud.alerts', handleNewAlert);
    return () => window.removeEventListener('fraud.alerts', handleNewAlert);
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      const updated = await monitoringApi.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.alertId === id ? updated : a));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'OPEN') return a.status === 'OPEN';
    if (filter === 'CRITICAL') return a.severity === 'CRITICAL';
    return true;
  });

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'OPEN').length;

  return (
    <div className="space-y-8 pb-10">
      {/* Cinematic Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-1 ${themeColors.bgAccent}`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${themeColors.accent} opacity-60`}>Intercept Protocol</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic">
            ALERT <span className={`${themeColors.accent} bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent`}>CENTER</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
            {(['ALL', 'OPEN', 'CRITICAL'] as const).map(f => (
              <button
                key={f}
                onClick={() => { playSound('CLICK'); setFilter(f); }}
                className={`px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all ${filter === f
                  ? `${themeColors.filterActive} text-white shadow-[0_0_15px_${themeColors.filterShadow}]`
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => { playSound('SCAN'); fetchAlerts(); }}
            className={`h-12 w-12 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all ${themeColors.iconColor} relative overflow-hidden`}
          >
            <HUDCorner position="top-right" />
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Intelligence Snapshot */}
        <div className="lg:col-span-1 space-y-8">
          <HUDCard title="Resolution Logic" icon={<CheckCircle2 size={16} />}>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-6 bg-emerald-500/5 border border-emerald-500/10 rounded-sm">
                <span className="text-4xl font-black italic tracking-tighter text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                  {alerts.length > 0
                    ? Math.round((alerts.filter(a => a.status === 'ACKNOWLEDGED').length / alerts.length) * 100)
                    : 0}%
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 mt-2">Protocol_Clear_Rate</span>
              </div>

              <div className="space-y-4">
                <HUDDataReadout label="Total Entities" value={`${alerts.length} TARGETS`} />
                <HUDDataReadout label="Critical Buffer" value={`${criticalCount} ACTIVE`} />
              </div>
            </div>
          </HUDCard>

          <HUDCard title="Active Infiltrators" icon={<ShieldAlert size={16} />}>
            <div className="flex flex-col items-center justify-center py-8 bg-red-500/5 border border-red-500/10 rounded-sm">
              <span className="text-6xl font-black italic tracking-tighter text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                {criticalCount}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 mt-4">High_Risk_Pool</span>
            </div>
          </HUDCard>
        </div>

        {/* Right Column: Intercept Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-6 py-3 bg-white/5 border border-white/5 rounded-lg mb-2">
            <div className="flex items-center gap-3">
              <Activity size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Live_Intercept_Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Engine_Sync_Active</span>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 bg-white/5 animate-pulse rounded-lg border border-white/5" />
                ))}
              </div>
            ) : filteredAlerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 bg-white/5 border border-dashed border-white/10 rounded-lg text-slate-500"
              >
                <Bell size={48} className="mb-6 opacity-20" />
                <span className="text-xs font-black uppercase tracking-[0.4em]">Zero Active Threats in Buffer</span>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAlerts.map(alert => (
                  <AlertCard
                    key={alert.alertId}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};