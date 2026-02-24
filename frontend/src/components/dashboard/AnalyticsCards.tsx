import { memo, useEffect, useMemo, useState } from 'react';
import { Transaction, TransactionStats } from '../../types';

interface AnalyticsCardsProps {
  transactions: Transaction[];
  stats: TransactionStats | null;
}

const cardStyle =
  'group relative overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:border-slate-500 hover:shadow-xl';

const AnimatedValue = ({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const initial = display;
    const target = Number.isFinite(value) ? value : 0;

    let raf = 0;
    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = initial + (target - initial) * eased;
      setDisplay(next);
      if (progress < 1) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className="metric-value text-3xl font-extrabold tracking-tight">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const AnalyticsCards = memo(({ transactions, stats }: AnalyticsCardsProps) => {
  const cards = useMemo(() => {
    const totalTransactions = transactions.length;
    const fraudCount = transactions.filter((t) => t.isFraud).length;
    const fraudRate = stats?.fraudRate ?? (totalTransactions ? fraudCount / totalTransactions : 0);
    const avgRisk =
      stats?.avgRiskScore ??
      (totalTransactions ? transactions.reduce((sum, tx) => sum + tx.fraudScore, 0) / totalTransactions : 0);

    return [
      {
        label: 'Total Transactions',
        value: totalTransactions,
        decimals: 0,
        suffix: '',
        display: 'number',
        tone: 'text-blue-300',
        icon: '◈'
      },
      {
        label: 'Fraud Transactions',
        value: fraudCount,
        decimals: 0,
        suffix: '',
        display: 'number',
        tone: 'text-red-300',
        icon: '⚠'
      },
      {
        label: 'Fraud Rate',
        value: fraudRate * 100,
        decimals: 2,
        suffix: '%',
        display: 'percent',
        tone: 'text-amber-300',
        icon: '◎'
      },
      {
        label: 'Average Risk Score',
        value: avgRisk,
        decimals: 1,
        suffix: '',
        display: 'score',
        tone: 'text-emerald-300',
        icon: '▣'
      }
    ];
  }, [transactions, stats]);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in">
      {cards.map((card) => (
        <article key={card.label} className={cardStyle}>
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <span className="text-lg text-slate-500 transition group-hover:text-slate-300">{card.icon}</span>
          </div>
          <p className={card.tone}>
            <AnimatedValue value={card.value} decimals={card.decimals} suffix={card.suffix} />
          </p>
        </article>
      ))}
    </section>
  );
});
