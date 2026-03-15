import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIntelligenceSlice } from '../store/slices/intelligenceSlice';
import { BrainCircuit, LineChart, Target, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { monitoringApi } from '../api/client';
import { ModelConfidenceChart } from '../components/intelligence/ModelConfidenceChart';
import { ModelDriftChart } from '../components/intelligence/ModelDriftChart';

import { ModelConfidenceRing } from '../components/visual/ModelConfidenceRing';
import { FeatureImportanceChart } from '../components/intelligence/FeatureImportanceChart';
import { ContributionBars } from '../components/intelligence/ContributionBars';
import { FeatureContribution } from '../types';

export const Intelligence = () => {
    const { connectLive, disconnectLive } = useIntelligenceSlice();

    // Query historical baseline to bootstrap charts before socket takes over
    const confidenceQuery = useQuery({
        queryKey: ['model-confidence-historical'],
        queryFn: () => monitoringApi.getDashboardModelConfidence(),
        staleTime: Infinity
    });

    const driftQuery = useQuery({
        queryKey: ['model-drift-historical'],
        queryFn: () => monitoringApi.getDashboardDrift(),
        staleTime: Infinity
    });

    // Initial state updated from historical queries or socket
    const [confidence, setConfidence] = useState(0);
    const [klDivergence, setKlDivergence] = useState(0);
    const [lastContributions, setLastContributions] = useState<FeatureContribution[]>([]);

    useEffect(() => {
        connectLive();

        const handleConf = (e: any) => setConfidence(e.detail.confidence);
        const handleDrift = (e: any) => setKlDivergence(e.detail.klDivergence);
        const handlePredict = (e: any) => {
            if (e.detail.featureContributions) {
                setLastContributions(e.detail.featureContributions);
            }
        };

        window.addEventListener('intelligence:confidence', handleConf);
        window.addEventListener('intelligence:drift', handleDrift);
        window.addEventListener('transactions:predict', handlePredict);

        return () => {
            window.removeEventListener('intelligence:confidence', handleConf);
            window.removeEventListener('intelligence:drift', handleDrift);
            window.removeEventListener('transactions:predict', handlePredict);
            disconnectLive();
        };
    }, [connectLive, disconnectLive]);

    useEffect(() => {
        if (confidenceQuery.data && confidenceQuery.data.length > 0) {
            setConfidence(confidenceQuery.data[confidenceQuery.data.length - 1].value);
        }
    }, [confidenceQuery.data]);

    useEffect(() => {
        if (driftQuery.data && driftQuery.data.length > 0) {
            setKlDivergence(driftQuery.data[driftQuery.data.length - 1].value);
        }
    }, [driftQuery.data]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="theme-page-title">Intelligence & ML Ops</h1>
                <p className="theme-page-subtitle">Live ensemble model monitoring, behavioral drift, and risk forecasting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="theme-surface-card theme-panel-accent p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}>
                                <BrainCircuit size={20} style={{ color: 'var(--accent)' }} />
                            </div>
                            <h3 className="theme-stat-label">Ensemble Confidence</h3>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center py-4">
                        <ModelConfidenceRing confidence={confidence} size={140} />
                    </div>
                </div>

                <div className="theme-surface-card theme-panel-warning p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--status-warning) 16%, transparent)' }}>
                                <Target size={20} style={{ color: 'var(--status-warning)' }} />
                            </div>
                            <h3 className="theme-stat-label">KL Divergence (Drift)</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="theme-strong-text text-4xl font-black">{klDivergence.toFixed(3)}</span>
                        <span className="theme-muted-text mb-1 text-sm font-bold">Threshold: 0.1</span>
                    </div>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--surface-3) 92%, transparent)' }}>
                        <motion.div
                            className="h-full"
                            style={{ background: klDivergence > 0.08 ? 'var(--status-danger)' : 'var(--status-warning)' }}
                            animate={{ width: `${Math.min(100, (klDivergence / 0.1) * 100)}%` }}
                        />
                    </div>
                </div>

                <div className="theme-surface-card theme-panel-accent col-span-1 p-6 md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)' }}>
                                <AlertOctagon size={20} style={{ color: 'var(--accent)' }} />
                            </div>
                            <h3 className="theme-stat-label">Explainable AI (SHAP) - Real-time Feature Contribution</h3>
                        </div>
                    </div>
                    {lastContributions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="theme-muted-text text-[10px] font-black uppercase tracking-widest">Live Prediction Baseline Shift</p>
                                <ContributionBars contributions={lastContributions} />
                            </div>
                            <div className="h-48">
                                <p className="theme-muted-text mb-4 text-center text-[10px] font-black uppercase tracking-widest">Relative Feature Importance</p>
                                <FeatureImportanceChart data={lastContributions} />
                            </div>
                        </div>
                    ) : (
                        <div className="theme-empty-state h-48">
                            <span className="theme-muted-text text-xs font-bold uppercase tracking-widest">Awaiting live prediction data...</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="theme-surface-card h-96 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <LineChart size={20} style={{ color: 'var(--accent)' }} />
                        <h3 className="theme-stat-label">Risk Forecast Projection</h3>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                        {confidenceQuery.isLoading ? (
                            <span className="theme-muted-text absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest">Loading data...</span>
                        ) : confidenceQuery.data ? (
                            <ModelConfidenceChart initialData={confidenceQuery.data} />
                        ) : null}
                    </div>
                </div>

                <div className="theme-surface-card h-96 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <Target size={20} style={{ color: 'var(--status-warning)' }} />
                        <h3 className="theme-stat-label">Model Drift (KL Divergence) Tracker</h3>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                        {driftQuery.isLoading ? (
                            <span className="theme-muted-text absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest">Loading analytics...</span>
                        ) : driftQuery.data ? (
                            <ModelDriftChart initialData={driftQuery.data} />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
