import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '../../types';

interface FraudPieChartProps {
  transactions: Transaction[];
}

export const FraudPieChart = ({ transactions }: FraudPieChartProps) => {
  const data = useMemo(() => {
    const fraud = transactions.filter((tx) => tx.isFraud).length;
    const legit = transactions.length - fraud;

    return [
      { name: 'Fraud', value: fraud, color: '#ef4444' },
      { name: 'Legit', value: legit, color: '#22c55e' }
    ];
  }, [transactions]);

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.1 }}>
      <h3 className="panel-title">Fraud vs Legit Transactions</h3>
      <div className="h-72">
        {transactions.length === 0 ? (
          <div className="app-empty h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400">No transactions available.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={4}>
                {data.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.name}: {item.value}
          </div>
        ))}
      </div>
    </motion.article>
  );
};
