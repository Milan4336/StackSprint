import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MoonStar, Save, SunMedium } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useThemeStore } from '../store/theme';

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
    scoreRuleWeight: 0.20,
    scoreMlWeight: 0.40,
    scoreBehaviorWeight: 0.25,
    scoreGraphWeight: 0.15,
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
      scoreBehaviorWeight: settingsQuery.data.scoreBehaviorWeight,
      scoreGraphWeight: settingsQuery.data.scoreGraphWeight,
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
        <h2 className="panel-title">Appearance & Effects</h2>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
          <div>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              Current theme: <span className="font-semibold text-emerald-500">{theme}</span>
            </p>
            <button type="button" onClick={toggleTheme} className="glass-btn">
              {theme === 'dark' ? <SunMedium size={15} /> : <MoonStar size={15} />}
              Toggle Theme
            </button>
          </div>
          <div>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              High Threat Border Glow: <span className="font-semibold text-emerald-500">{useThemeStore(s => s.enableThreatGlow) ? 'Enabled' : 'Disabled'}</span>
            </p>
            <button type="button" onClick={() => useThemeStore.getState().toggleThreatGlow()} className="glass-btn">
              Toggle Threat Glow
            </button>
          </div>
        </div>
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

          <div className="md:col-span-2 grid grid-cols-2 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl gap-4 border border-slate-200 dark:border-slate-700">
            <h3 className="col-span-2 text-xs font-black uppercase tracking-widest text-slate-500">Ensemble Master Weights</h3>
            <label className="text-sm text-slate-700 dark:text-slate-200">
              Rule Weight
              <input
                className="input mt-1"
                type="number" min={0} max={1} step={0.01}
                value={form.scoreRuleWeight}
                onChange={(event) => setForm((prev) => ({ ...prev, scoreRuleWeight: Number(event.target.value) }))}
              />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-200">
              ML Weight
              <input
                className="input mt-1"
                type="number" min={0} max={1} step={0.01}
                value={form.scoreMlWeight}
                onChange={(event) => setForm((prev) => ({ ...prev, scoreMlWeight: Number(event.target.value) }))}
              />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-200">
              Behavior Weight
              <input
                className="input mt-1"
                type="number" min={0} max={1} step={0.01}
                value={form.scoreBehaviorWeight}
                onChange={(event) => setForm((prev) => ({ ...prev, scoreBehaviorWeight: Number(event.target.value) }))}
              />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-200">
              Graph Weight
              <input
                className="input mt-1"
                type="number" min={0} max={1} step={0.01}
                value={form.scoreGraphWeight}
                onChange={(event) => setForm((prev) => ({ ...prev, scoreGraphWeight: Number(event.target.value) }))}
              />
            </label>
          </div>

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
              {updateMutation.isPending ? 'Saving Runtime...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </motion.section>

      <MlEnsembleSettings />
    </div>
  );
};

const MlEnsembleSettings = () => {
  const queryClient = useQueryClient();
  const modelInfoQuery = useQuery({
    queryKey: ['model-info'],
    queryFn: () => monitoringApi.getModelInfo()
  });

  const [mlForm, setMlForm] = useState<{ weights: Record<string, number>, fraud_threshold: number }>({
    weights: {},
    fraud_threshold: 0.55
  });

  useEffect(() => {
    if (modelInfoQuery.data) {
      setMlForm({
        weights: modelInfoQuery.data.ensemble.weights,
        fraud_threshold: modelInfoQuery.data.ensemble.fraud_threshold
      });
    }
  }, [modelInfoQuery.data]);

  const mlUpdateMutation = useMutation({
    mutationFn: () => monitoringApi.updateModelConfig(mlForm),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['model-info'] })
  });

  const onMlSubmit = (e: FormEvent) => {
    e.preventDefault();
    mlUpdateMutation.mutate();
  };

  if (modelInfoQuery.isLoading) return null;

  return (
    <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
      <h2 className="panel-title">ML Ensemble Orchestration</h2>
      <p className="text-xs text-slate-500 mb-6 font-bold uppercase tracking-widest">Configure per-model sub-weighting for the ML scoring layer.</p>

      <form onSubmit={onMlSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(mlForm.weights).map(([model, weight]) => (
            <label key={model} className="text-xs font-black uppercase tracking-widest text-slate-500">
              {model.replace('_', ' ')} Weight
              <input
                className="input mt-2"
                type="number" step={0.01} min={0} max={1}
                value={weight}
                onChange={e => setMlForm(prev => ({
                  ...prev,
                  weights: { ...prev.weights, [model]: Number(e.target.value) }
                }))}
              />
            </label>
          ))}
        </div>

        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 max-w-xs">
          Consensus Fraud Threshold
          <input
            className="input mt-2"
            type="number" step={0.01} min={0} max={1}
            value={mlForm.fraud_threshold}
            onChange={e => setMlForm(prev => ({ ...prev, fraud_threshold: Number(e.target.value) }))}
          />
        </label>

        <button className="glass-btn" disabled={mlUpdateMutation.isPending} type="submit">
          <Cpu size={14} />
          {mlUpdateMutation.isPending ? 'Updating Neural Plane...' : 'Push Ensemble Config'}
        </button>
      </form>
    </motion.section>
  );
};
