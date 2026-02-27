import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart
} from 'recharts';
import { AlertTriangle, CheckCircle2, Cpu, RefreshCcw, ShieldCheck } from 'lucide-react';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';

export const ModelHealth = () => {
  const queryClient = useQueryClient();
  const [retraining, setRetraining] = useState(false);

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

  const retrainMutation = useMutation({
    mutationFn: () => monitoringApi.retrainModel(),
    onSuccess: () => {
      setRetraining(true);
      setTimeout(() => setRetraining(false), 5000);
      queryClient.invalidateQueries({ queryKey: ['model-info'] });
    }
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
      { name: 'Low', value: latest.scoreDistribution.low, fill: '#10b981' },
      { name: 'Medium', value: latest.scoreDistribution.medium, fill: '#f59e0b' },
      { name: 'High', value: latest.scoreDistribution.high, fill: '#ef4444' }
    ]
    : [];

  const weightData = useMemo(() => {
    if (!modelInfoQuery.data?.ensemble.weights) return [];
    return Object.entries(modelInfoQuery.data.ensemble.weights).map(([name, weight]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value: weight,
      color: name === 'xgboost' ? '#3b82f6' : name === 'isolation_forest' ? '#8b5cf6' : '#ec4899'
    }));
  }, [modelInfoQuery.data]);

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 italic tracking-tight">ENSEMBLE MODEL REGISTRY</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Bank-grade multi-model fraud detection orchestration</p>
        </div>
        <button
          onClick={() => retrainMutation.mutate()}
          disabled={retrainMutation.isPending || retraining}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCcw size={16} className={retrainMutation.isPending || retraining ? 'animate-spin' : ''} />
          {retraining ? 'RETRAINING INITIATED' : 'TRIGGER ENSEMBLE RETRAIN'}
        </button>
      </header>

      {/* ── Ensemble Model Cards ──────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-3">
        {(modelInfoQuery.data?.models ?? []).map((model) => (
          <article key={model.modelName} className="panel relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Cpu size={48} />
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-500 ring-1 ring-blue-500/30">
                V{model.version}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                <CheckCircle2 size={12} /> ACTIVE
              </span>
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
              {model.modelName.replace('_', ' ')}
            </h4>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Last Trained</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {new Date(model.trainedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Accuracy</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {model.metrics.accuracy ? `${Math.round(model.metrics.accuracy * 100)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* ── Main Analytics ────────────────────────────────────── */}
      <section className="grid gap-4 xl:grid-cols-12">
        {/* Trend Chart */}
        <article className="panel xl:col-span-8 h-[400px]">
          <h3 className="panel-title flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500" />
            Detection Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Line type="monotone" name="Fraud Rate (%)" dataKey="fraudRate" stroke="#ef4444" strokeWidth={3} dot={false} />
              <Line type="monotone" name="Avg Score" dataKey="avgScore" stroke="#3b82f6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        {/* Dynamic Weight Allocation */}
        <article className="panel xl:col-span-4 h-[400px]">
          <h3 className="panel-title">Ensemble Voting Weights</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={weightData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {weightData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: number) => `${Math.round(val * 100)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {weightData.map((w) => (
              <div key={w.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                  <span className="font-bold text-slate-500">{w.name}</span>
                </div>
                <span className="font-mono font-bold dark:text-slate-100">{Math.round(w.value * 100)}%</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ── Status Bar ────────────────────────────────────────── */}
      <footer className="panel border-l-4 border-blue-500 flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">ALL MODELS OPERATIONAL</p>
            <p className="text-xs text-slate-500 tracking-tight">Consensus threshold set to {Math.round((modelInfoQuery.data?.ensemble.fraud_threshold ?? 0.55) * 100)}%</p>
          </div>
        </div>
        {!latest?.driftDetected ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold">
            <CheckCircle2 size={14} /> NO DRIFT DETECTED
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-bold">
            <AlertTriangle size={14} /> DRIFT DETECTED: {latest.driftReason}
          </div>
        )}
      </footer>
    </div>
  );
};
