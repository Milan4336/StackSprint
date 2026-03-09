import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { monitoringApi } from '../api/client';
import { SimulationControls } from '../components/simulation/SimulationControls';
import { useTransactionsSlice } from '../store/slices/transactionsSlice';
import { TransactionVolumeChart } from '../components/dashboard/TransactionVolumeChart';

export const Simulation = () => {
    const { connectLive, disconnectLive } = useTransactionsSlice();

    const { data: recentTxs } = useQuery({
        queryKey: ["simulation-transactions"],
        queryFn: () => monitoringApi.getTransactions(200),
        refetchInterval: 3000
    });

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="section-title">Fraud Simulation Engine</h1>
                <p className="section-subtitle mt-1">
                    Execute controlled high-velocity fraud attacks to test system resilience and model latency.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <SimulationControls />
                </div>

                <div className="lg:col-span-2">
                    <TransactionVolumeChart transactions={recentTxs || []} />
                </div>
            </div>
        </div>
    );
};
