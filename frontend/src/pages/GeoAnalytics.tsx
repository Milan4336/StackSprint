import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plane, Globe, AlertTriangle, Crosshair, Map as MapIcon, ShieldAlert, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { monitoringApi } from '../api/client';
import { FraudRadarMap } from '../components/radar/FraudRadarMap';
import { getSocket } from '../services/socket';
import { Transaction } from '../types';
import { HUDCard } from '../components/layout/HUDCard';
import { HUDDataReadout, HUDCorner, HUDScanline } from '../components/visual/HUDDecorations';
import { useUISound } from '../hooks/useUISound';
import { useThemeStore } from '../store/themeStore';

interface GeoPoint { lat: number; lng: number; risk: number; }

export const GeoAnalytics = () => {
    const [liveCount, setLiveCount] = useState(0);
    const { playSound } = useUISound();
    const { theme } = useThemeStore();

    const color = theme === 'neon' ? 'text-purple-400' : theme === 'tactical' ? 'text-emerald-400' : 'text-blue-400';
    const bgColor = theme === 'neon' ? 'bg-purple-500' : theme === 'tactical' ? 'bg-emerald-500' : 'bg-blue-500';

    const { data: geoPoints = [] } = useQuery<GeoPoint[]>({
        queryKey: ['geo-intensity'],
        queryFn: () => monitoringApi.getGeoIntensity(),
        refetchInterval: 20000,
    });

    const { data: transactions = [] } = useQuery<Transaction[]>({
        queryKey: ['geo-transactions'],
        queryFn: () => monitoringApi.getTransactions(400),
        refetchInterval: 20000,
    });

    useEffect(() => {
        const socket = getSocket();
        const handler = (_pt: GeoPoint) => {
            setLiveCount(c => c + 1);
            playSound('ALERT');
        };
        socket.on('geo.live', handler);
        return () => {
            socket.off('geo.live', handler);
        };
    }, [playSound]);

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
        .slice(0, 4);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className={`h-4 w-1 ${bgColor}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${color} opacity-60`}>Geospatial Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic">
                        TERRAIN <span className={`${color} bg-gradient-to-r from-slate-200 to-white bg-clip-text text-transparent`}>SCAN</span>
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <HUDDataReadout label="Atmosphere" value="Nominal" />
                    <HUDDataReadout label="Satellites" value="08 Active" />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <HUDCard title="Impossible Travel Vectors" icon={<Plane size={16} />}>
                    <div className="flex items-end justify-between">
                        <div>
                            <span className="text-5xl font-black text-white tabular-nums tracking-tighter">{jumps}</span>
                            <span className="ml-2 text-xs font-black uppercase text-red-500 tracking-widest">Breaches</span>
                        </div>
                        <ShieldAlert className="text-red-500/40" size={40} />
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-4 tracking-tighter">Anomaly detected in {txs.length} blocks</p>
                </HUDCard>

                <HUDCard title="Regional Risk Clusters" icon={<Globe size={16} />}>
                    <div className="space-y-4">
                        {topRegions.map((region, i) => (
                            <div key={region.name} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                                    <span className="text-slate-500 font-mono">{region.name}</span>
                                    <span className={color}>{region.risk}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${region.risk}%` }}
                                        transition={{ delay: i * 0.1, duration: 1 }}
                                        className={`h-full ${region.risk > 50 ? 'bg-red-500' : bgColor}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </HUDCard>

                <HUDCard title="Live Feed Telemetry" icon={<Activity size={16} />}>
                    <div className="flex items-end justify-between">
                        <div>
                            <span className="text-5xl font-black text-white tabular-nums tracking-tighter italic">{geoPoints.length}</span>
                            <span className={`ml-3 text-[10px] font-black uppercase ${color} tracking-widest`}>Sources</span>
                        </div>
                        <Crosshair className={`${color} opacity-40 animate-pulse`} size={40} />
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase mt-4 tracking-[0.2em] font-mono">
                        +{liveCount} INTERCEPT_EVENTS
                    </p>
                </HUDCard>
            </div>

            {/* Main Map */}
            <HUDCard title="Strategic Intelligence Map" icon={<MapIcon size={16} />}>
                <div className="rounded-xl overflow-hidden border border-white/5">
                    {txs.length > 0 ? (
                        <FraudRadarMap transactions={txs} />
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center bg-black/20">
                            <Globe size={48} className={`${color} opacity-20 animate-spin-slow mb-6`} />
                            <p className={`text-xs font-black uppercase tracking-[0.5em] ${color} opacity-60`}>Calibrating Satellite Matrix</p>
                        </div>
                    )}
                </div>
            </HUDCard>

            {geoPoints.length > 0 && (
                <HUDCard title="High-Intensity Risk Coordinates" icon={<AlertTriangle size={16} />}>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {[...geoPoints]
                            .sort((a, b) => b.risk - a.risk)
                            .slice(0, 10)
                            .map((pt, i) => (
                                <div key={i} className="group p-5 bg-black/40 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all hover:bg-white/5 relative overflow-hidden">
                                    <HUDCorner position="top-right" />
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">VEC_COORD_{i}</div>
                                    <div className={`text-3xl font-black italic tracking-tighter ${pt.risk >= 0.7 ? 'text-red-500' : pt.risk >= 0.4 ? 'text-orange-500' : color}`}>
                                        {Math.round(pt.risk * 100)}%
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500 mt-3 flex justify-between border-t border-white/5 pt-2">
                                        <span>{pt.lat.toFixed(2)}N</span>
                                        <span>{pt.lng.toFixed(2)}E</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </HUDCard>
            )}
        </div>
    );
};
