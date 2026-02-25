import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Info,
  Radio,
  ShieldAlert,
  TriangleAlert
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityEventType,
  ActivityFeedFilter,
  ActivityFeedItem,
  useActivityFeedStore
} from '../../store/activityFeedStore';
import { formatSafeDate } from '../../utils/date';

const filterOptions: Array<{ label: string; value: ActivityFeedFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Transactions', value: 'transaction' },
  { label: 'Alerts', value: 'alert' },
  { label: 'Cases', value: 'case' },
  { label: 'Simulation', value: 'simulation' },
  { label: 'ML', value: 'ml' },
  { label: 'System', value: 'system' }
];

const toneBySeverity = {
  info: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
  warning: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  critical: 'text-red-300 border-red-500/30 bg-red-500/10'
} as const;

const iconFor = (entry: ActivityFeedItem) => {
  if (entry.severity === 'critical') return ShieldAlert;
  if (entry.severity === 'warning') return TriangleAlert;

  if (entry.type === 'transaction') return Bell;
  if (entry.type === 'simulation') return Radio;
  if (entry.type === 'system') return Info;
  return CircleDot;
};

const isTypeMatch = (itemType: ActivityEventType, filter: ActivityFeedFilter): boolean =>
  filter === 'all' ? true : itemType === filter;

export const LiveActivityFeed = () => {
  const isOpen = useActivityFeedStore((state) => state.isOpen);
  const toggleOpen = useActivityFeedStore((state) => state.toggleOpen);
  const paused = useActivityFeedStore((state) => state.paused);
  const setPaused = useActivityFeedStore((state) => state.setPaused);
  const filter = useActivityFeedStore((state) => state.filter);
  const setFilter = useActivityFeedStore((state) => state.setFilter);
  const clear = useActivityFeedStore((state) => state.clear);
  const items = useActivityFeedStore((state) => state.items);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const filteredItems = useMemo(() => items.filter((item) => isTypeMatch(item.type, filter)), [filter, items]);

  useEffect(() => {
    if (paused) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [filteredItems, paused]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-xl border border-slate-600/70 bg-slate-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 shadow-lg backdrop-blur transition hover:border-blue-400/60"
      >
        <Radio size={14} />
        Live Feed
        <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <section className="fixed bottom-4 right-4 z-40 w-[23rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700/80 bg-slate-950/88 shadow-2xl backdrop-blur">
      <header className="flex items-center justify-between border-b border-slate-700/70 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Live Activity Feed</p>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setPaused(!paused)} className="glass-btn px-2 py-1 text-[11px]">
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={toggleOpen} className="glass-btn px-2 py-1 text-[11px]">
            <ChevronDown size={13} />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
        <select
          className="input h-8 py-1 text-xs"
          value={filter}
          onChange={(event) => setFilter(event.target.value as ActivityFeedFilter)}
        >
          {filterOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={clear} className="glass-btn px-2 py-1 text-[11px]">
          Clear
        </button>
      </div>

      <div ref={scrollRef} className="max-h-[24rem] space-y-2 overflow-y-auto px-3 py-2">
        <AnimatePresence initial={false}>
          {filteredItems.map((entry) => {
            const Icon = iconFor(entry);
            return (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18 }}
                className={`rounded-xl border px-2.5 py-2 ${toneBySeverity[entry.severity]}`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    <Icon size={12} />
                    {entry.type}
                  </p>
                  <span className="text-[10px] text-slate-300">{formatSafeDate(entry.timestamp)}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-100">{entry.message}</p>
              </motion.article>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-4 text-center text-xs text-slate-400">
            No activity events for the selected filter.
          </div>
        ) : null}
      </div>
    </section>
  );
};
