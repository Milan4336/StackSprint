import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoonStar, Save, SunMedium } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export const Settings = () => {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => monitoringApi.getSettings()
  });

  const [form, setForm] = useState({
    highAmountThreshold: 5000,
    velocityWindowMinutes: 5,
    velocityTxThreshold: 5,
    scoreRuleWeight: 0.6,
    scoreMlWeight: 0.4,
    autonomousAlertThreshold: 80,
    simulationMode: false
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm({
      highAmountThreshold: settingsQuery.data.highAmountThreshold,
      velocityWindowMinutes: settingsQuery.data.velocityWindowMinutes,
      velocityTxThreshold: settingsQuery.data.velocityTxThreshold,
      scoreRuleWeight: settingsQuery.data.scoreRuleWeight,
      scoreMlWeight: settingsQuery.data.scoreMlWeight,
      autonomousAlertThreshold: settingsQuery.data.autonomousAlertThreshold,
      simulationMode: settingsQuery.data.simulationMode
    });
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => monitoringApi.updateSettings(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="section-title">Platform Settings</h2>
        <p className="section-subtitle mt-1">Configure risk thresholds, scoring weights, and simulation controls.</p>
      </motion.section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <h2 className="panel-title">Appearance</h2>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Current theme: {theme}</p>
        <button type="button" onClick={toggleTheme} className="glass-btn">
          {theme === 'dark' ? <SunMedium size={15} /> : <MoonStar size={15} />}
          Toggle Theme
        </button>
      </motion.section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <h2 className="panel-title">Fraud Runtime Settings</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            High Amount Threshold
            <input
              className="input mt-1"
              type="number"
              value={form.highAmountThreshold}
              onChange={(event) => setForm((prev) => ({ ...prev, highAmountThreshold: Number(event.target.value) }))}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            Velocity Window Minutes
            <input
              className="input mt-1"
              type="number"
              value={form.velocityWindowMinutes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, velocityWindowMinutes: Number(event.target.value) }))
              }
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            Velocity Transaction Threshold
            <input
              className="input mt-1"
              type="number"
              value={form.velocityTxThreshold}
              onChange={(event) => setForm((prev) => ({ ...prev, velocityTxThreshold: Number(event.target.value) }))}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            Rule Weight
            <input
              className="input mt-1"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={form.scoreRuleWeight}
              onChange={(event) => setForm((prev) => ({ ...prev, scoreRuleWeight: Number(event.target.value) }))}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            ML Weight
            <input
              className="input mt-1"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={form.scoreMlWeight}
              onChange={(event) => setForm((prev) => ({ ...prev, scoreMlWeight: Number(event.target.value) }))}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            Autonomous Alert Threshold
            <input
              className="input mt-1"
              type="number"
              min={1}
              max={100}
              value={form.autonomousAlertThreshold}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, autonomousAlertThreshold: Number(event.target.value) }))
              }
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 md:col-span-2">
            <input
              type="checkbox"
              checked={form.simulationMode}
              onChange={(event) => setForm((prev) => ({ ...prev, simulationMode: event.target.checked }))}
            />
            Enable Simulation Mode
          </label>
          <div className="md:col-span-2">
            <button className="glass-btn" disabled={updateMutation.isPending} type="submit">
              <Save size={14} />
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </motion.section>
    </div>
  );
};
