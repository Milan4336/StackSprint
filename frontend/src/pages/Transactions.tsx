import { useMemo } from 'react';
import { CreateTransactionForm } from '../components/CreateTransactionForm';
import { RiskBadge } from '../components/RiskBadge';
import { useTransactions } from '../context/TransactionContext';
import { formatSafeDate, safeDate } from '../utils/date';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const Transactions = () => {
  const { transactions, loading, error, refreshTransactions } = useTransactions();

  const sorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => (safeDate(b.timestamp)?.getTime() ?? 0) - (safeDate(a.timestamp)?.getTime() ?? 0)
      ),
    [transactions]
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">Create Transaction</h2>
        <CreateTransactionForm />
      </section>

      <section className="panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="panel-title">Transactions</h3>
          <button
            type="button"
            onClick={() => void refreshTransactions()}
            className="glass-btn"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error ? <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
        {loading && sorted.length === 0 ? (
          <div className="mb-4 grid gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`tx-skeleton-${index}`} className="skeleton h-12" />
            ))}
          </div>
        ) : null}

        <div className="table-shell">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900/95 text-left text-xs uppercase tracking-[0.16em] text-slate-400 backdrop-blur">
              <tr>
                <th className="px-3 py-3">Transaction</th>
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Risk Score</th>
                <th className="px-3 py-3">Risk</th>
                <th className="px-3 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((tx) => (
                <tr key={tx.transactionId} className="border-t border-slate-800/70 bg-slate-900/35 transition hover:bg-slate-800/65">
                  <td className="px-3 py-3 font-semibold text-blue-100">{tx.transactionId}</td>
                  <td className="px-3 py-3 text-slate-300">{tx.userId}</td>
                  <td className="px-3 py-3 font-semibold text-slate-100">{money.format(tx.amount)}</td>
                  <td className="px-3 py-3 text-slate-300">{tx.location}</td>
                  <td className="px-3 py-3 text-slate-200">{tx.fraudScore}</td>
                  <td className="px-3 py-3">
                    <RiskBadge value={tx.riskLevel} />
                  </td>
                  <td className="px-3 py-3 text-slate-400">{formatSafeDate(tx.timestamp)}</td>
                </tr>
              ))}
              {sorted.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-400" colSpan={7}>
                    No transactions yet. Create or simulate transactions.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
