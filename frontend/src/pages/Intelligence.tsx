import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIntelligenceSlice } from '../store/slices/intelligenceSlice';
import { BrainCircuit, LineChart, Target, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { monitoringApi } from '../api/client';
import { ModelConfidenceChart } from '../components/intelligence/ModelConfidenceChart';
import { ModelDriftChart } from '../components/intelligence/ModelDriftChart';

import { ModelConfidenceRing } from '../components/visual/ModelConfidenceRing';

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

    useEffect(() => {
        connectLive();

        const handleConf = (e: any) => setConfidence(e.detail.confidence);
        const handleDrift = (e: any) => setKlDivergence(e.detail.klDivergence);

        window.addEventListener('intelligence:confidence', handleConf);
        window.addEventListener('intelligence:drift', handleDrift);

        return () => {
            window.removeEventListener('intelligence:confidence', handleConf);
            window.removeEventListener('intelligence:drift', handleDrift);
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
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Intelligence & ML Ops</h1>
                <p className="text-sm font-bold text-slate-400 mt-1">Live ensemble model monitoring, behavioral drift, and risk forecasting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <BrainCircuit className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Ensemble Confidence</h3>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center py-4">
                        <ModelConfidenceRing confidence={confidence} size={140} />
                    </div>
                </div>

                <div className="rounded-2xl border border-orange-500/20 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Target className="text-orange-400" size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">KL Divergence (Drift)</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-white">{klDivergence.toFixed(3)}</span>
                        <span className="text-sm font-bold text-slate-500 mb-1">Threshold: 0.1</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <motion.div
                            className={`h-full ${klDivergence > 0.08 ? 'bg-red-500' : 'bg-orange-500'}`}
                            animate={{ width: `${Math.min(100, (klDivergence / 0.1) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <LineChart className="text-blue-400" size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Risk Forecast Projection</h3>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                        {confidenceQuery.isLoading ? (
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest absolute inset-0 flex items-center justify-center">Loading Data...</span>
                        ) : confidenceQuery.data ? (
                            <ModelConfidenceChart initialData={confidenceQuery.data} />
                        ) : null}
                    </div>
                </div>

                <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="text-orange-400" size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Model Drift (KL Divergence) Tracker</h3>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                        {driftQuery.isLoading ? (
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest absolute inset-0 flex items-center justify-center">Loading Analytics...</span>
                        ) : driftQuery.data ? (
                            <ModelDriftChart initialData={driftQuery.data} />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
