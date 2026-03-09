import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Search, SlidersHorizontal, Activity, ShieldAlert, Cpu, Terminal, Fingerprint } from 'lucide-react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { CreateTransactionForm } from '../components/CreateTransactionForm';
import { ErrorState } from '../components/ErrorState';
import { RiskBadge } from '../components/RiskBadge';
import { ForensicDetailModal } from '../components/transactions/ForensicDetailModal';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';
import { Transaction } from '../types';
import { TransactionAura } from '../components/visual/TransactionAura';
import { HUDCard } from '../components/layout/HUDCard';
import { HUDDataReadout, HUDCorner, HUDScanline } from '../components/visual/HUDDecorations';
import { useUISound } from '../hooks/useUISound';
import { useThemeStore } from '../store/themeStore';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const RiskPulse = ({ score }: { score: number }) => {
  const color = score > 80 ? 'bg-red-500' : score > 50 ? 'bg-orange-500' : 'bg-blue-500';
  return (
    <motion.div
      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
      transition={{ duration: 1, repeat: Infinity }}
      className={`absolute inset-0 ${color} rounded-sm pointer-events-none opacity-20`}
    />
  );
};

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
  const { playSound } = useUISound();
  const { theme } = useThemeStore();

  const color = theme === 'neon' ? 'text-purple-400' : theme === 'tactical' ? 'text-emerald-400' : 'text-blue-400';
  const bgColor = theme === 'neon' ? 'bg-purple-500' : theme === 'tactical' ? 'bg-emerald-500' : 'bg-blue-500';
  const shadowColor = theme === 'neon' ? 'rgba(168,85,247,0.3)' : theme === 'tactical' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)';

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

  const handleSelect = (id: string) => {
    playSound('CLICK');
    setSelectedTxId(id);
  };

  const Row = ({ index, style }: ListChildComponentProps) => {
    const tx: Transaction = rows[index];
    if (!tx) return null;

    const isSelected = selectedTxId === tx.transactionId;
    const isFraud = tx.fraudScore && tx.fraudScore > 80;

    return (
      <div
        onClick={() => handleSelect(tx.transactionId)}
        onMouseEnter={() => playSound('HOVER')}
        className={`group relative flex items-center px-4 py-3 cursor-pointer transition-all duration-300 border-l-2 border-transparent hover:bg-white/5 ${isSelected ? `bg-${theme === 'neon' ? 'purple' : theme === 'tactical' ? 'emerald' : 'blue'}-500/10 border-${theme === 'neon' ? 'purple' : theme === 'tactical' ? 'emerald' : 'blue'}-500` : ''}`}
        style={{ ...style, boxShadow: isSelected ? `inset 10px 0 15px -10px ${shadowColor}` : 'none' }}
      >
        {isFraud && <RiskPulse score={tx.fraudScore || 0} />}

        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr_0.6fr_0.8fr_1fr_1fr_0.2fr] w-full items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <div className={`h-1.5 w-1.5 rounded-full ${isFraud ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : `${bgColor} opacity-40`}`} />
            <span className={`truncate font-black ${isSelected ? (theme === 'neon' ? 'text-purple-200' : theme === 'tactical' ? 'text-emerald-200' : 'text-blue-200') : 'text-slate-500 group-hover:text-slate-200'}`}>{tx.transactionId.slice(0, 12)}...</span>
          </div>
          <span className="truncate text-slate-500 group-hover:text-slate-300 uppercase tracking-tighter font-black">{tx.userId || 'GEN_USER'}</span>
          <span className="font-bold text-white tabular-nums tracking-tighter">{money.format(tx.amount)}</span>
          <span className="truncate text-slate-500 text-[9px]">{tx.location || 'GLOBAL_NODE'}</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden w-8">
              <div className={`h-full ${isFraud ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${tx.fraudScore || 0}%` }} />
            </div>
            <span className={`${isFraud ? 'text-red-400' : 'text-slate-400'}`}>{tx.fraudScore || 0}</span>
          </div>
          <p>
            <RiskBadge value={tx.riskLevel} />
          </p>
          <span className="truncate uppercase text-[9px] tracking-widest text-blue-500/60 font-black">{tx.action || 'PENDING'}</span>
          <span className="text-slate-600 text-[10px] tabular-nums whitespace-nowrap">{formatSafeDate(tx.timestamp)}</span>
          <div className="flex justify-end">
            <div className={`h-2 w-2 rounded-full ${tx.isFraud ? 'bg-red-500 shadow-pulse-red' : 'bg-emerald-500 shadow-pulse-green'}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-1 ${bgColor}`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${color} opacity-60`}>Forensic Intelligence Matrix</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic">
            LIVE <span className={`${color} bg-gradient-to-r from-slate-200 to-white bg-clip-text text-transparent`}>FEED</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            className={`h-12 px-6 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] ${color}`}
            onClick={() => { playSound('SCAN'); query.refetch(); }}
          >
            <RefreshCw size={14} className={query.isFetching ? 'animate-spin' : ''} />
            Recalibrate Stream
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Console */}
        <div className="lg:col-span-1 space-y-8">
          <HUDCard title="Entry Vector Injection" icon={<Terminal size={16} />}>
            <CreateTransactionForm />
          </HUDCard>

          <HUDCard title="Universal Filter Matrix" icon={<SlidersHorizontal size={16} />}>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-xs focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="ID, HASH, USER..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] outline-none text-slate-300" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                  <option value="">ALL_RISK</option>
                  <option value="Low">LOW_VEC</option>
                  <option value="Medium">MED_VEC</option>
                  <option value="High">HIGH_VEC</option>
                </select>
                <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] outline-none text-slate-300" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                  <option value="timestamp">SORT_DATE</option>
                  <option value="amount">SORT_VALUE</option>
                  <option value="fraudScore">SORT_RISK</option>
                </select>
              </div>
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs outline-none" placeholder="USER_ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs outline-none" placeholder="DEVICE_ID" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] outline-none" type="number" placeholder="MIN_$" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
                <input className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] outline-none" type="number" placeholder="MAX_$" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
              </div>
            </div>
          </HUDCard>
        </div>

        {/* Center/Right: Data Stream */}
        <div className="lg:col-span-2 space-y-8">
          <HUDCard title="Holographic Data Stream" icon={<Activity size={16} />}>
            <div className="flex items-center gap-6 mb-6 px-4 py-3 bg-black/40 rounded-lg border border-white/5 relative overflow-hidden">
              <HUDScanline />
              <HUDDataReadout label="Active Buffer" value={`${query.data?.total ?? 0} BLOCKS`} />
              <div className="h-8 w-px bg-white/10" />
              <HUDDataReadout label="Sync Speed" value="HYPER-SYNC" />
            </div>

            <div className="relative overflow-hidden border border-white/10 rounded-lg bg-black/20">
              {/* Table Header */}
              <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr_0.6fr_0.8fr_1fr_1fr_0.2fr] gap-4 px-4 py-3 bg-white/5 border-b border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                <p>IDENTIFIER</p>
                <p>ENTITY</p>
                <p>VALUE</p>
                <p>NODE</p>
                <p>SCORE</p>
                <p>STATUS</p>
                <p>PROTOCOL</p>
                <p>TELEMETRY</p>
                <p>F</p>
              </div>

              {query.isLoading ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-10 bg-white/5 animate-pulse rounded" />
                  ))}
                </div>
              ) : rows.length > 0 ? (
                <div className="modern-scrollbar">
                  <FixedSizeList height={500} itemCount={rows.length} itemSize={52} width="100%">
                    {Row}
                  </FixedSizeList>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <AlertTriangle size={48} className="text-slate-500 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Zero Hits in Matrix</p>
                </div>
              )}
            </div>

            {/* Pagination HUD */}
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Sector Load: {query.data?.page ?? page}/{query.data?.pages ?? 1}
              </span>
              <div className="flex gap-4">
                <button
                  onClick={() => { playSound('CLICK'); setPage(p => Math.max(1, p - 1)); }}
                  disabled={page <= 1}
                  className="px-4 py-2 border border-white/10 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[9px] font-black uppercase tracking-[0.2em]"
                >
                  PREV_SECTOR
                </button>
                <button
                  onClick={() => { playSound('CLICK'); setPage(p => p + 1); }}
                  disabled={page >= (query.data?.pages ?? 1)}
                  className="px-4 py-2 border border-white/10 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[9px] font-black uppercase tracking-[0.2em]"
                >
                  NEXT_SECTOR
                </button>
              </div>
            </div>
          </HUDCard>

          {/* Forensic Triage Section */}
          <HUDCard title="Deep Forensic Triage" icon={<Search size={16} />} delay={0.2}>
            {!selected ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-xl opacity-50">
                <Fingerprint className="text-blue-500 mb-4" size={40} />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Scan Required to Initialize Probe</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <HUDDataReadout label="IDENTIFIER" value={selected.transactionId.slice(0, 12) + '...'} />
                  <HUDDataReadout label="ENTITY_ID" value={selected.userId || 'N/A'} />
                  <HUDDataReadout label="HARDWARE_ID" value={selected.deviceId || 'N/A'} />
                  <HUDDataReadout label="PROTOCOL_ACTION" value={selected.action || 'PENDING'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Neural Synthesis</p>
                    <div className={`flex items-center justify-between p-4 ${bgColor}/5 rounded-lg border ${bgColor}/10`}>
                      <span className="text-xs text-slate-400 uppercase tracking-widest font-black">Confidence Vector</span>
                      <span className={`text-xl font-black ${color} font-mono tracking-tighter`}>{((selected.mlScore || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={() => { playSound('SCAN'); setShowForensicModal(true); }}
                      className={`w-full relative overflow-hidden group py-4 rounded-lg ${bgColor} font-black text-xs uppercase tracking-[0.4em] hover:opacity-80 transition-all text-white shadow-[0_0_20px_${shadowColor}]`}
                    >
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full skew-x-12"
                      />
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        <Cpu size={14} />
                        Execute Deep Analysis
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </HUDCard>
        </div>
      </div>

      <AnimatePresence>
        {showForensicModal && selected && (
          <ForensicDetailModal
            transaction={selected}
            onClose={() => setShowForensicModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
