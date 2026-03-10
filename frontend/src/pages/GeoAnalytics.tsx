import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plane, Globe, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { monitoringApi } from '../api/client';
import { FraudRadarMap } from '../components/radar/FraudRadarMap';
import { getSocket } from '../services/socket';
import { Transaction } from '../types';

interface GeoPoint { lat: number; lng: number; risk: number; }

export const GeoAnalytics = () => {
    const [liveCount, setLiveCount] = useState(0);

    // Geo intensity from real API (Part 4)
    const { data: geoPoints = [] } = useQuery<GeoPoint[]>({
        queryKey: ['geo-intensity'],
        queryFn: () => monitoringApi.getGeoIntensity(),
        refetchInterval: 20000,
    });

    // Transactions for FraudRadarMap
    const { data: transactions = [] } = useQuery<Transaction[]>({
        queryKey: ['geo-transactions'],
        queryFn: () => monitoringApi.getTransactions(400),
        refetchInterval: 20000,
    });

    // Part 4 — direct geo.live socket listener (does NOT call disconnectSocket)
    useEffect(() => {
        const socket = getSocket();
        const handler = (_pt: GeoPoint) => {
            setLiveCount(c => c + 1);
        };
        socket.on('geo.live', handler);
        return () => {
            // ONLY remove this specific listener — do NOT disconnect the shared socket
            socket.off('geo.live', handler);
        };
    }, []);

    // Computed stats
    const txs = transactions;
    const jumps = txs.filter(t => t.geoVelocityFlag).length;

    const regionMap = new Map<string, { total: number; fraud: number }>();
    txs.forEach(t => {
        const loc = (t.country || t.location || 'Unknown').toUpperCase().trim().slice(0, 12);
        const stat = regionMap.get(loc) || { total: 0, fraud: 0 };
        stat.total++;
        if (t.isFraud) stat.fraud++;
        regionMap.set(loc, stat);
    });
    const topRegions = Array.from(regionMap.entries())
        .filter(([, s]) => s.total >= 3)
        .map(([name, stat]) => ({ name, risk: Math.round((stat.fraud / stat.total) * 100) }))
        .sort((a, b) => b.risk - a.risk)
        .slice(0, 3);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Geo Analytics</h1>
                <p className="text-sm font-bold text-slate-400 mt-1">Global origin heatmaps, impossible travel detection, and regional risk.</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-red-500/20 bg-slate-900/50 p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Impossible Travel</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-white">{jumps}</span>
                            <span className="text-sm font-bold text-red-400 mb-1">Detected</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Based on {txs.length} transactions</p>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <Plane className="text-red-500" size={28} />
                    </div>
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                        <Globe size={14} /> Mapped Points
                    </h3>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-white">{geoPoints.length}</span>
                        <span className="text-sm font-bold text-blue-400 mb-1">Clusters</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
                        +{liveCount} live stream events
                    </p>
                </div>

                <div className="rounded-2xl border border-purple-500/20 bg-slate-900/50 p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Top Risk Regions</h3>
                    <div className="space-y-3 mt-2">
                        {topRegions.map((region, i) => (
                            <div key={region.name}>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-200">{region.name}</span>
                                    <span className="text-slate-400">{region.risk}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-red-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${region.risk}%` }}
                                        transition={{ delay: i * 0.1 }}
                                    />
                                </div>
                            </div>
                        ))}
                        {topRegions.length === 0 && (
                            <p className="text-xs text-slate-500">Awaiting transaction data...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Full-width map — Leaflet renders into a fixed container */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden" style={{ height: 520 }}>
                {txs.length > 0 ? (
                    <FraudRadarMap transactions={txs} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Globe size={48} className="mb-4 opacity-30" />
                        <p className="text-sm font-black uppercase tracking-widest">Loading map data...</p>
                    </div>
                )}
            </div>

            {/* High-risk geo clusters */}
            {geoPoints.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                        <AlertTriangle size={14} className="inline mr-2 text-amber-400" />
                        Top Risk Clusters (24h)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[...geoPoints]
                            .sort((a, b) => b.risk - a.risk)
                            .slice(0, 10)
                            .map((pt, i) => (
                                <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 text-center">
                                    <div className={`text-lg font-black ${pt.risk >= 0.7 ? 'text-red-400' : pt.risk >= 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {Math.round(pt.risk * 100)}%
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1">
                                        {pt.lat.toFixed(1)}, {pt.lng.toFixed(1)}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};
