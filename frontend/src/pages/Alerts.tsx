import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ErrorState } from '../components/ErrorState';
import { monitoringApi } from '../api/client';
import { useTransactions } from '../context/TransactionContext';
import { useActivityFeedStore } from '../store/activityFeedStore';
import { formatSafeDate } from '../utils/date';

const tabs = [
  'Overview',
  'Fraud Explanation',
  'User History',
  'Device Intelligence',
  'Geo Movement',
  'Case Management',
  'Timeline'
] as const;

type AlertTab = (typeof tabs)[number];

const riskTone = (risk: string): string => {
  if (risk === 'High') return 'text-red-300 border-red-500/40 bg-red-500/10';
  if (risk === 'Medium') return 'text-amber-300 border-amber-500/40 bg-amber-500/10';
  return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
};

export const Alerts = () => {
  const queryClient = useQueryClient();
  const { transactions } = useTransactions();
  const addCaseEvent = useActivityFeedStore((state) => state.addCaseEvent);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'open' | 'investigating' | 'resolved' | ''>('');
  const [search, setSearch] = useState('');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AlertTab>('Overview');

  const alertsQuery = useQuery({
    queryKey: ['alerts', page, status, search],
    queryFn: () =>
      monitoringApi.queryAlerts({
        page,
        limit: 20,
        status: status || undefined,
        search: search || undefined
      }),
    refetchInterval: 5000
  });

  const selectedAlert = useMemo(
    () => (alertsQuery.data?.data ?? []).find((alert) => alert.alertId === selectedAlertId) ?? null,
    [alertsQuery.data, selectedAlertId]
  );

  const detailsQuery = useQuery({
    queryKey: ['alert-detail', selectedAlertId],
    queryFn: () => monitoringApi.getAlertDetails(selectedAlertId as string),
    enabled: Boolean(selectedAlertId)
  });

  const createCaseMutation = useMutation({
    mutationFn: () =>
      monitoringApi.createCase({
        transactionId: detailsQuery.data?.alert.transactionId ?? '',
        alertId: detailsQuery.data?.alert.alertId
      }),
    onSuccess: async (createdCase) => {
      addCaseEvent({
        action: 'created',
        caseId: createdCase.caseId,
        assignedTo: createdCase.assignedTo
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['alert-detail', selectedAlertId] })
      ]);
    }
  });

  const txLookup = useMemo(() => new Map(transactions.map((tx) => [tx.transactionId, tx])), [transactions]);
  const transaction = detailsQuery.data?.transaction;
  const progress = Math.max(0, Math.min(100, Number(transaction?.fraudScore ?? selectedAlert?.fraudScore ?? 0)));
  const gaugeStyle = { background: `conic-gradient(#ef4444 ${progress}%, rgba(148,163,184,0.2) 0)` };

  const scoreBreakdown = [
    { name: 'Rule Score', value: Number(transaction?.ruleScore ?? 0), fill: '#3b82f6' },
    { name: 'ML Score', value: Number((Number(transaction?.mlScore ?? 0) * 100).toFixed(2)), fill: '#22c55e' }
  ];

  const timelineEntries = useMemo(() => {
    if (!detailsQuery.data) return [];
    const entries: Array<{ at: string; title: string; detail: string }> = [
      {
        at: detailsQuery.data.alert.createdAt,
        title: 'Alert Generated',
        detail: detailsQuery.data.alert.reason
      }
    ];

    detailsQuery.data.userHistory.slice(0, 8).forEach((tx) => {
      entries.push({
        at: tx.timestamp,
        title: 'User Transaction',
        detail: `${tx.transactionId} • ${tx.location} • ${tx.amount}`
      });
    });

    detailsQuery.data.cases.forEach((item) => {
      item.timeline.forEach((t) => {
        entries.push({
          at: t.at,
          title: `Case ${item.caseId}`,
          detail: `${t.actor} • ${t.action}${t.note ? ` • ${t.note}` : ''}`
        });
      });
    });

    return entries.sort((a, b) => {
      const aTime = new Date(a.at).getTime();
      const bTime = new Date(b.at).getTime();
      return bTime - aTime;
    });
  }, [detailsQuery.data]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Alert Investigation Queue</h2>
            <p className="section-subtitle mt-1">Review and triage autonomous fraud alerts in realtime.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input w-48"
              placeholder="Search alerts..."
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
            <select
              className="input w-40"
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as 'open' | 'investigating' | 'resolved' | '');
              }}
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {alertsQuery.isError ? (
          <div className="mt-3">
            <ErrorState
              message="Failed to load alerts."
              onRetry={() => {
                void alertsQuery.refetch();
              }}
            />
          </div>
        ) : null}

        <div className="table-shell">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100/95 text-left text-xs uppercase tracking-[0.16em] text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400">
              <tr>
                <th className="px-3 py-3">Alert</th>
                <th className="px-3 py-3">Transaction</th>
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Risk Score</th>
                <th className="px-3 py-3">Risk</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Device</th>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {alertsQuery.isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-3 py-2">
                      <div className="skeleton h-10" />
                    </td>
                  </tr>
                ))
                : alertsQuery.data?.data.map((alert) => {
                  const relatedTx = txLookup.get(alert.transactionId);
                  return (
                    <tr
                      key={alert.alertId}
                      className={[
                        'cursor-pointer table-row',
                        selectedAlertId === alert.alertId ? 'ring-1 ring-blue-400/50' : ''
                      ].join(' ')}
                      onClick={() => {
                        setSelectedAlertId(alert.alertId);
                        setActiveTab('Overview');
                      }}
                    >
                      <td className="px-3 py-3 font-semibold text-blue-700 dark:text-blue-200">{alert.alertId}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{alert.transactionId}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{alert.userId}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{alert.fraudScore}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${riskTone(alert.riskLevel)}`}>
                          {alert.riskLevel}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{relatedTx?.location ?? 'N/A'}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{relatedTx?.deviceId ?? 'N/A'}</td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{formatSafeDate(alert.createdAt)}</td>
                      <td className="px-3 py-3 text-slate-700 capitalize dark:text-slate-300">{alert.status}</td>
                    </tr>
                  );
                })}
              {!alertsQuery.isLoading && !alertsQuery.data?.data.length ? (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={9}>
                    No alerts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <p>
            Page {alertsQuery.data?.page ?? page} of {alertsQuery.data?.pages ?? 1}
          </p>
          <div className="flex gap-2">
            <button className="glass-btn" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Previous
            </button>
            <button
              className="glass-btn"
              disabled={page >= (alertsQuery.data?.pages ?? 1)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <h3 className="panel-title">Investigation Workspace</h3>
        {!selectedAlertId ? (
          <div className="app-empty">
            <p className="text-sm text-slate-500 dark:text-slate-400">Select an alert to start investigation.</p>
          </div>
        ) : detailsQuery.isLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-20" />
            <div className="skeleton h-44" />
            <div className="skeleton h-10" />
            <div className="skeleton h-36" />
          </div>
        ) : detailsQuery.isError ? (
          <ErrorState
            message="Failed to load alert investigation details."
            onRetry={() => {
              void detailsQuery.refetch();
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative grid h-20 w-20 place-items-center rounded-full p-1" style={gaugeStyle}>
                <div className="grid h-full w-full place-items-center rounded-full bg-slate-950/90 text-sm font-bold text-slate-100">
                  {progress}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Fraud Score Gauge</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">Risk level: {detailsQuery.data?.alert.riskLevel}</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">Action: {transaction?.action ?? 'N/A'}</p>
              </div>
            </div>

            <div className="h-44 rounded-xl border border-slate-200/80 bg-white/40 p-2 dark:border-slate-700/70 dark:bg-slate-900/40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: 10,
                      color: '#e2e8f0',
                      fontSize: 13
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Pie data={scoreBreakdown} dataKey="value" nameKey="name" outerRadius={60} innerRadius={34}>
                    {scoreBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`glass-btn ${activeTab === tab ? 'ring-1 ring-blue-400/50' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Overview' ? (
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <p>Alert: {detailsQuery.data?.alert.alertId}</p>
                <p>Reason: {detailsQuery.data?.alert.reason}</p>
                <p>Rule vs ML: {transaction?.ruleScore ?? 'N/A'} / {transaction?.mlScore ?? 'N/A'}</p>
              </div>
            ) : null}

            {activeTab === 'Fraud Explanation' ? (
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {transaction?.explanations?.length ? (
                  transaction.explanations.map((item) => (
                    <div key={`${item.feature}-${item.reason}`} className="rounded-lg border border-slate-300 p-2 dark:border-slate-700">
                      <p className="font-semibold">{item.feature}</p>
                      <p>Impact: {(item.impact * 100).toFixed(0)}%</p>
                      <p>{item.reason}</p>
                    </div>
                  ))
                ) : (
                  <p>No explanations available.</p>
                )}
              </div>
            ) : null}

            {activeTab === 'User History' ? (
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {detailsQuery.data?.userHistory.map((tx) => (
                  <p key={tx.transactionId}>
                    {tx.transactionId} - {tx.location} - {tx.amount} - {formatSafeDate(tx.timestamp)}
                  </p>
                ))}
              </div>
            ) : null}

            {activeTab === 'Device Intelligence' ? (
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {detailsQuery.data?.devices.map((device) => (
                  <p key={`${device.userId}-${device.deviceId}`}>
                    {device.deviceId} | {device.location} | tx {device.txCount} | {device.isSuspicious ? 'Suspicious' : 'Trusted'}
                  </p>
                ))}
              </div>
            ) : null}

            {activeTab === 'Geo Movement' ? (
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {detailsQuery.data?.userHistory.map((tx) => (
                  <p key={tx.transactionId}>
                    {tx.location} ({tx.latitude ?? 'N/A'}, {tx.longitude ?? 'N/A'}) - {formatSafeDate(tx.timestamp)}
                  </p>
                ))}
              </div>
            ) : null}

            {activeTab === 'Case Management' ? (
              <div className="space-y-3">
                <button
                  className="glass-btn"
                  onClick={() => createCaseMutation.mutate()}
                  disabled={createCaseMutation.isPending || !detailsQuery.data}
                >
                  {createCaseMutation.isPending ? 'Creating Case...' : 'Create Case from Alert'}
                </button>
                {detailsQuery.data?.cases.map((item) => (
                  <p key={item.caseId} className="text-sm text-slate-700 dark:text-slate-200">
                    {item.caseId} | {item.status} | {item.priority}
                  </p>
                ))}
              </div>
            ) : null}

            {activeTab === 'Timeline' ? (
              <div className="space-y-2">
                {timelineEntries.length === 0 ? (
                  <div className="app-empty">
                    <AlertTriangle className="text-slate-400" size={18} />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No timeline events available.</p>
                  </div>
                ) : (
                  timelineEntries.map((entry, index) => (
                    <div
                      key={`${entry.at}-${entry.title}-${index}`}
                      className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                    >
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        {formatSafeDate(entry.at)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{entry.detail}</p>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        )}
      </motion.section>
    </div>
  );
};
