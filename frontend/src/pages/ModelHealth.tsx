import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';

export const ModelHealth = () => {
  const modelInfoQuery = useQuery({
    queryKey: ['model-info'],
    queryFn: () => monitoringApi.getModelInfo(),
    refetchInterval: 10000
  });

  const modelHealthQuery = useQuery({
    queryKey: ['model-health'],
    queryFn: () => monitoringApi.getModelHealth(120),
    refetchInterval: 10000
  });

  const trendData = useMemo(
    () =>
      (modelHealthQuery.data?.metrics ?? [])
        .slice()
        .reverse()
        .map((item) => ({
          time: formatSafeDate(item.snapshotAt),
          fraudRate: Number((item.fraudRate * 100).toFixed(2)),
          avgScore: Number(item.avgFraudScore.toFixed(2))
        })),
    [modelHealthQuery.data]
  );

  const latest = modelHealthQuery.data?.latest ?? null;
  const dist = latest
    ? [
        { name: 'Low', value: latest.scoreDistribution.low, fill: '#22c55e' },
        { name: 'Medium', value: latest.scoreDistribution.medium, fill: '#f59e0b' },
        { name: 'High', value: latest.scoreDistribution.high, fill: '#ef4444' }
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-3">
        <article className="panel">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Model Name</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {modelInfoQuery.data?.modelName ?? 'N/A'}
          </p>
        </article>
        <article className="panel">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Model Version</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {modelInfoQuery.data?.modelVersion ?? 'N/A'}
          </p>
        </article>
        <article className="panel">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Runtime ML Status</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {modelInfoQuery.data?.mlStatus ?? 'N/A'}
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="panel h-[360px]">
          <h3 className="panel-title">Fraud Rate + Score Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="fraudRate" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="panel h-[360px]">
          <h3 className="panel-title">Latest Score Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dist} dataKey="value" nameKey="name" outerRadius={120} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="panel">
        <h3 className="panel-title">Drift Detection</h3>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          Drift: {latest?.driftDetected ? 'Detected' : 'Not Detected'}
        </p>
        {latest?.driftReason ? (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {latest.driftReason}
          </p>
        ) : null}
      </section>
    </div>
  );
};
