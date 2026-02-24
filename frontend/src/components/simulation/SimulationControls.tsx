import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useDashboardStore } from '../../store/dashboard';

export const SimulationControls = () => {
  const startSimulation = useDashboardStore((state) => state.startSimulation);
  const simulationMessage = useDashboardStore((state) => state.simulationMessage);
  const { refreshTransactions } = useTransactions();

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onStart = async () => {
    setRunning(true);
    setError(null);
    try {
      await startSimulation(50);
      await refreshTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.06 }}>
      <h3 className="panel-title">Fraud Simulation Mode</h3>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Launch a controlled fraud attack simulation to generate 50 high-risk patterns and observe live response.
      </p>

      <button
        type="button"
        onClick={onStart}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
      >
        <Rocket size={15} />
        {running ? 'Starting Simulation...' : 'Start Fraud Attack Simulation'}
      </button>

      {simulationMessage ? <p className="mt-3 text-sm font-semibold text-emerald-300">{simulationMessage}</p> : null}
      {error ? <p className="mt-3 text-sm font-semibold text-red-300">{error}</p> : null}
    </motion.article>
  );
};
