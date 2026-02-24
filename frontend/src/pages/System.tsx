import { motion } from 'framer-motion';
import { Activity, Database, Gauge, Network, RadioTower, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';

const tone = (status: 'UP' | 'DOWN') =>
  status === 'UP'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-red-500/30 bg-red-500/10 text-red-300';

export const System = () => {
  const healthQuery = useQuery({
    queryKey: ['system-health'],
    queryFn: () => monitoringApi.getSystemHealth(),
    refetchInterval: 7000
  });

  const mlStatusQuery = useQuery({
    queryKey: ['system-ml-status'],
    queryFn: () => monitoringApi.getMlStatus(),
    refetchInterval: 7000
  });

  const health = healthQuery.data;

  return (
    <div className="space-y-6">
      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="section-title">System Health</h2>
        <p className="section-subtitle mt-1">Live infrastructure and ML reliability telemetry from API, database, cache, and websocket subsystems.</p>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">API Latency</p>
          <div className="mt-2 flex items-center gap-2">
            <Gauge className="text-blue-400" size={18} />
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{health?.apiLatencyMs ?? 0} ms</p>
          </div>
        </article>
        <article className="metric-card">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">ML Latency</p>
          <div className="mt-2 flex items-center gap-2">
            <Activity className="text-emerald-400" size={18} />
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{health?.mlLatencyMs ?? 0} ms</p>
          </div>
        </article>
        <article className="metric-card">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Redis Latency</p>
          <div className="mt-2 flex items-center gap-2">
            <Network className="text-cyan-400" size={18} />
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{health?.redisLatencyMs ?? 0} ms</p>
          </div>
        </article>
        <article className="metric-card">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">WebSocket Clients</p>
          <div className="mt-2 flex items-center gap-2">
            <RadioTower className="text-amber-400" size={18} />
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{health?.websocketClients ?? 0}</p>
          </div>
        </article>
      </section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <h2 className="panel-title">Infrastructure Status</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <p className={`rounded-lg border px-3 py-2 text-sm font-semibold ${tone(health?.mongoStatus ?? 'DOWN')}`}>
            <Database size={14} className="mr-2 inline" /> Mongo: {health?.mongoStatus ?? 'DOWN'}
          </p>
          <p className={`rounded-lg border px-3 py-2 text-sm font-semibold ${tone(health?.redisStatus ?? 'DOWN')}`}>
            <Database size={14} className="mr-2 inline" /> Redis: {health?.redisStatus ?? 'DOWN'}
          </p>
          <p className={`rounded-lg border px-3 py-2 text-sm font-semibold ${tone(health?.mlStatus ?? 'DOWN')}`}>
            <ShieldCheck size={14} className="mr-2 inline" /> ML API: {health?.mlStatus ?? 'DOWN'}
          </p>
          <p className={`rounded-lg border px-3 py-2 text-sm font-semibold ${tone(health?.websocketStatus ?? 'DOWN')}`}>
            <RadioTower size={14} className="mr-2 inline" /> WebSocket: {health?.websocketStatus ?? 'DOWN'}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Snapshot: {formatSafeDate(health?.timestamp)}</p>
      </motion.section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <h2 className="panel-title">ML Reliability</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <p className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            Status: <span className="font-semibold">{mlStatusQuery.data?.status ?? 'OFFLINE'}</span>
          </p>
          <p className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            Failure Count: <span className="font-semibold">{mlStatusQuery.data?.failureCount ?? 0}</span>
          </p>
          <p className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            Circuit Open Until: <span className="font-semibold">{formatSafeDate(mlStatusQuery.data?.circuitOpenUntil ?? null)}</span>
          </p>
          <p className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            Last Error: <span className="font-semibold">{mlStatusQuery.data?.lastError ?? 'N/A'}</span>
          </p>
        </div>
      </motion.section>
    </div>
  );
};
