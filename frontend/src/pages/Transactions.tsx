import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { CreateTransactionForm } from '../components/CreateTransactionForm';
import { ErrorState } from '../components/ErrorState';
import { RiskBadge } from '../components/RiskBadge';
import { ForensicDetailModal } from '../components/transactions/ForensicDetailModal';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';
import { Transaction } from '../types';
import { TransactionAura } from '../components/visual/TransactionAura';
import { HUDPanel, HUDDataReadout } from '../components/visual/HUDDecorations';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const Transactions = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [userId, setUserId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount' | 'fraudScore' | 'riskLevel' | 'createdAt'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [showForensicModal, setShowForensicModal] = useState(false);

  const query = useQuery({
    queryKey: [
      'transactions-query',
      page,
      search,
      riskLevel,
      userId,
      deviceId,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy,
      sortOrder
    ],
    queryFn: () =>
      monitoringApi.queryTransactions({
        page,
        limit: 25,
        search: search || undefined,
        riskLevel: riskLevel || undefined,
        userId: userId || undefined,
        deviceId: deviceId || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder
      }),
    refetchInterval: 5000
  });

  const selected = useMemo(
    () => query.data?.data.find((item) => item.transactionId === selectedTxId) ?? null,
    [query.data, selectedTxId]
  );
  const rows = query.data?.data ?? [];

  const Row = ({ index, style }: ListChildComponentProps) => {
    const tx: Transaction = rows[index];
    if (!tx) return null;

    return (
      <div
        style={style}
        onClick={() => setSelectedTxId(tx.transactionId)}
        className={[
          'grid cursor-pointer grid-cols-[1.2fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_1.1fr_0.3fr] items-center px-3 text-sm table-row relative',
          selectedTxId === tx.transactionId ? 'ring-1 ring-blue-400/50' : ''
        ].join(' ')}
      >
        <TransactionAura riskScore={tx.fraudScore || 0} />
        <p className="truncate font-semibold text-blue-700 dark:text-blue-100 relative z-10">{tx.transactionId}</p>
        <p className="truncate text-slate-700 dark:text-slate-300 relative z-10">{tx.userId}</p>
        <p className="truncate font-semibold text-slate-900 dark:text-slate-100 relative z-10">{money.format(tx.amount)}</p>
        <p className="truncate text-slate-700 dark:text-slate-300 relative z-10">{tx.location}</p>
        <p className="truncate text-slate-700 dark:text-slate-200 relative z-10">{tx.fraudScore}</p>
        <p className="relative z-10">
          <RiskBadge value={tx.riskLevel} />
        </p>
        <p className="truncate text-slate-700 dark:text-slate-200 relative z-10">{tx.action ?? 'N/A'}</p>
        <p className="truncate text-slate-500 dark:text-slate-400 relative z-10">{formatSafeDate(tx.timestamp)}</p>
        <p className={`relative z-10 ${tx.isFraud ? 'text-red-400' : 'text-emerald-400'}`}>{tx.isFraud ? '●' : '●'}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <HUDPanel title="Management Controller">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex gap-4">
              <HUDDataReadout label="Module" value="Transactional Forensics" />
              <HUDDataReadout label="Access" value="L4 Investigator" />
              <HUDDataReadout label="State" value="Real-time Feed" />
            </div>
            <p className="section-subtitle mt-2">Enterprise monitoring with advanced filters and investigation vectors.</p>
          </div>
          <button className="glass-btn border-blue-500/30 text-blue-400" onClick={() => query.refetch()}>
            <RefreshCw size={14} className="animate-spin-slow" />
            Refresh Intelligence
          </button>
        </div>
      </HUDPanel>

      <section>
        <HUDPanel title="Entry Vector Console">
          <CreateTransactionForm />
        </HUDPanel>
      </section>

      <HUDPanel title="Filtering Matrix">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-blue-400">
          <SlidersHorizontal size={14} />
          Filter Parameter Injection
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative md:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input className="input pl-9 bg-blue-500/5" placeholder="Search user, device, hash..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select className="input bg-blue-500/5" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="">All Risk Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <input className="input bg-blue-500/5" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <input className="input bg-blue-500/5" placeholder="Device ID" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
          <input className="input bg-blue-500/5" type="number" placeholder="Min Amount" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          <input className="input bg-blue-500/5" type="number" placeholder="Max Amount" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          <input className="input bg-blue-500/5" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input className="input bg-blue-500/5" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <select className="input bg-blue-500/5" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="timestamp">Sort: Timestamp</option>
            <option value="amount">Sort: Amount</option>
            <option value="fraudScore">Sort: Fraud Score</option>
            <option value="riskLevel">Sort: Risk Level</option>
            <option value="createdAt">Sort: Created At</option>
          </select>
          <select className="input bg-blue-500/5" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </HUDPanel>

      {
        query.isError ? (
          <ErrorState
            message="Failed to load transaction feed."
            onRetry={() => {
              void query.refetch();
            }}
          />
        ) : null
      }

      <HUDPanel title="Transactional Stream Processor">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-4">
            <HUDDataReadout label="Buffer" value={`${query.data?.total ?? 0} blocks`} />
            <HUDDataReadout label="Latency" value="< 50ms" />
          </div>
        </div>

        <div className="table-shell">
          <div className="grid grid-cols-[1.2fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_1.1fr_0.3fr] bg-slate-100/95 px-3 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400">
            <p>Transaction</p>
            <p>User</p>
            <p>Amount</p>
            <p>Location</p>
            <p>Risk Score</p>
            <p>Risk</p>
            <p>Action</p>
            <p>Time</p>
            <p>F</p>
          </div>

          {query.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-11" />
              ))}
            </div>
          ) : rows.length > 0 ? (
            <FixedSizeList height={460} itemCount={rows.length} itemSize={52} width="100%">
              {Row}
            </FixedSizeList>
          ) : (
            <div className="app-empty m-3">
              <AlertTriangle className="text-slate-400" size={20} />
              <p className="text-sm text-slate-500 dark:text-slate-400">No transactions match current filters.</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
          <p>
            Sector {query.data?.page ?? page} / {query.data?.pages ?? 1}
          </p>
          <div className="flex gap-2">
            <button className="glass-btn text-[10px]" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              PREV BLOCK
            </button>
            <button
              className="glass-btn text-[10px]"
              disabled={page >= (query.data?.pages ?? 1)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              NEXT BLOCK
            </button>
          </div>
        </div>
      </HUDPanel>

      <HUDPanel title="Deep Forensic Triage">
        {!selected ? (
          <div className="app-empty border-white/5">
            <Search className="text-blue-500/40" size={32} />
            <p className="hud-readout mt-2">Initialize sector scan to select entity</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <HUDDataReadout label="IDENTIFIER" value={selected.transactionId} />
            <HUDDataReadout label="ENTITY_ID" value={selected.userId} />
            <HUDDataReadout label="HARDWARE_ID" value={selected.deviceId} />
            <HUDDataReadout label="RESPONSE_ACTION" value={selected.action ?? 'N/A'} />
            <HUDDataReadout label="HEURISTIC_SCORE" value={selected.ruleScore ?? 'N/A'} />
            <HUDDataReadout label="NEURAL_SCORE" value={selected.mlScore ?? 'N/A'} />
            <HUDDataReadout label="MODEL_VECTOR" value={`${selected.modelName ?? 'N/A'} ${selected.modelVersion ?? ''}`} />
            <HUDDataReadout label="GEO_ANOMALY" value={selected.geoVelocityFlag ? 'TRIPPED' : 'CLEAR'} />

            <div className="md:col-span-2 lg:col-span-4 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowForensicModal(true)}
                className="w-full glass-btn border-blue-500/40 text-blue-500 hover:bg-blue-500 hover:text-white font-black text-xs uppercase tracking-[0.2em] py-3 transition-all group"
              >
                <span className="group-hover:scale-110 transition-transform inline-block">Execute Deep Forensic Probe</span>
              </button>
            </div>
          </div>
        )}
      </HUDPanel>

      <AnimatePresence>
        {showForensicModal && selected && (
          <ForensicDetailModal
            transaction={selected}
            onClose={() => setShowForensicModal(false)}
          />
        )}
      </AnimatePresence>
    </div >
  );
};
