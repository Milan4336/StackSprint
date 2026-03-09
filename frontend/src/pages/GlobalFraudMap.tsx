import { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    Activity,
    Globe as GlobeIcon,
    Layers,
    Maximize2,
    Minimize2,
    Crosshair,
    Zap,
    Terminal,
    Cpu,
    Play,
    Pause,
    Clock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../hooks/useSocket';
import { HUDPanel } from '../components/visual/HUDDecorations';
import { MapHUD } from '../components/map/MapHUD';
import { ForensicReportOverlay } from '../components/intelligence/ForensicReportOverlay';
import { monitoringApi } from '../api/client';

interface GeoTransaction {
    transactionId: string;
    latitude: number;
    longitude: number;
    fraudScore: number;
    city: string;
    country: string;
    timestamp: number;
}

export const GlobalFraudMap = () => {
    const globeRef = useRef<any>();
    const [transactions, setTransactions] = useState<GeoTransaction[]>([]);
    const [arcs, setArcs] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
    const [threatIndex, setThreatIndex] = useState(42);
    const [filters, setFilters] = useState({ minScore: 0, region: 'Global' });
    const [shockwaves, setShockwaves] = useState<any[]>([]);
    const [playbackTime, setPlaybackTime] = useState<number | null>(null);
    const [isPlaybackRunning, setIsPlaybackRunning] = useState(false);
    const [reportData, setReportData] = useState<{ isOpen: boolean; content: string; txId: string }>({
        isOpen: false,
        content: '',
        txId: ''
    });
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('transactions.geo', (data: any) => {
            const newTx: GeoTransaction = {
                ...data.payload,
                id: data.payload.transactionId
            };

            setTransactions((prev: any) => [newTx, ...prev].slice(0, 50));

            // Filter filtering
            if (newTx.fraudScore < filters.minScore / 100) return;
            if (filters.region !== 'Global' && newTx.country !== filters.region) return;

            // Update Threat Index dynamically
            setThreatIndex((prev: any) => Math.min(100, Math.max(0, prev + (newTx.fraudScore > 0.7 ? 2 : -0.5))));

            // Create animated arc if it's high risk (Simulated origin for flow)
            if (newTx.fraudScore > 0.4) {
                const originLat = 40.7128; // NYC as a mock origin for many flows
                const originLng = -74.0060;

                const newArc = {
                    startLat: originLat,
                    startLng: originLng,
                    endLat: newTx.latitude,
                    endLng: newTx.longitude,
                    color: newTx.fraudScore > 0.8 ? '#ef4444' : '#f59e0b',
                    txId: newTx.transactionId
                };

                setArcs((prev: any) => [...prev, newArc].slice(-20));
            }

            // Attack Wave Detection
            if (newTx.fraudScore > 0.9) {
                const recentHighRisk = transactions.filter((t: any) => t.fraudScore > 0.8 && Date.now() - t.timestamp < 10000).length;
                if (recentHighRisk > 3) {
                    setShockwaves((prev: any) => [...prev, { lat: newTx.latitude, lng: newTx.longitude, color: '#ef4444' }]);
                    // Clear shockwave after expansion
                    setTimeout(() => setShockwaves((prev: any) => prev.slice(1)), 3000);
                }
            }

            // Auto-rotation to the new point
            if (globeRef.current && newTx.fraudScore > 0.8) {
                globeRef.current.pointOfView({ lat: newTx.latitude, lng: newTx.longitude, altitude: 2 }, 1000);
            }
        });

        return () => { socket.off('transactions.geo'); };
    }, [socket, filters]);

    useEffect(() => {
        if (!isPlaybackRunning || !playbackTime) return;

        const interval = setInterval(() => {
            setPlaybackTime(prev => {
                if (!prev) return null;
                const next = prev + 1000 * 60; // Advance 1 minute
                const max = Math.max(...transactions.map(t => t.timestamp));
                return next > max ? null : next;
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isPlaybackRunning, playbackTime, transactions]);

    const displayedTransactions = useMemo(() => {
        if (!playbackTime) return transactions;
        return transactions.filter(t => t.timestamp <= playbackTime);
    }, [transactions, playbackTime]);

    const ringsData = useMemo(() => {
        return displayedTransactions.map(t => ({
            lat: t.latitude,
            lng: t.longitude,
            maxR: t.fraudScore * 10,
            propagationSpeed: 2,
            repeatPeriod: 1000,
            color: t.fraudScore > 0.8 ? '#ef4444' : (t.fraudScore > 0.4 ? '#fbbf24' : '#3b82f6')
        }));
    }, [displayedTransactions]);

    return (
        <div className="relative h-screen w-full bg-[#030712] overflow-hidden font-['Inter']">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Main Map/Globe Component */}
            <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                {viewMode === '3D' ? (
                    <Globe
                        ref={globeRef}
                        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

                        ringsData={ringsData}
                        ringColor={(d: any) => d.color}
                        ringMaxRadius={(d: any) => d.maxR}
                        ringPropagationSpeed={(d: any) => d.propagationSpeed}
                        ringRepeatPeriod={(d: any) => d.repeatPeriod}

                        arcsData={arcs}
                        arcColor={(d: any) => d.color}
                        arcDashLength={0.4}
                        arcDashGap={4}
                        arcDashAnimateTime={1500}
                        arcStroke={0.5}

                        pointsData={displayedTransactions}
                        pointLat="latitude"
                        pointLng="longitude"
                        pointColor={(d: any) => d.fraudScore > 0.8 ? '#ef4444' : '#3b82f6'}
                        pointRadius={(t: any) => t.fraudScore * 2}
                        onPointClick={async (point: any) => {
                            const report = await monitoringApi.getCopilotReport(point.transactionId);
                            setReportData({ isOpen: true, content: report, txId: point.transactionId });
                        }}

                        atmosphereColor="#2563eb"
                        atmosphereAltitude={0.15}

                        customLayerData={shockwaves}
                        customThreeObject={(d: any) => {
                            const mesh = new THREE.Mesh(
                                new THREE.TorusGeometry(2, 0.05, 2, 64),
                                new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.8 })
                            );
                            return mesh;
                        }}
                        customThreeObjectUpdate={(obj: any, d: any) => {
                            obj.scale.set(obj.scale.x + 0.1, obj.scale.y + 0.1, 1);
                            obj.material.opacity *= 0.95;
                        }}
                    />
                ) : (
                    <MapContainer center={[20, 0]} zoom={3} style={{ height: '100%', width: '100%', background: '#030712' }}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        {displayedTransactions.map(t => (
                            <CircleMarker
                                key={t.transactionId}
                                center={[t.latitude, t.longitude]}
                                radius={t.fraudScore * 10}
                                pathOptions={{ color: t.fraudScore > 0.8 ? '#ef4444' : '#3b82f6', fillOpacity: 0.6 }}
                                eventHandlers={{
                                    click: async () => {
                                        const report = await monitoringApi.getCopilotReport(t.transactionId);
                                        setReportData({ isOpen: true, content: report, txId: t.transactionId });
                                    }
                                }}
                            />
                        ))}
                    </MapContainer>
                )}
            </div>

            {/* Cyber HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                {/* Top Header Section */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-3">
                            <span className="p-2 bg-blue-600 rounded-lg"><GlobeIcon size={24} /></span>
                            GLOBAL THREAT MATRIX <span className="text-blue-500 font-normal">v4.0.2</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md pointer-events-auto">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surveillance Active</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md pointer-events-auto">
                                <Activity size={12} className="text-blue-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nodes Tracked: 1,422</span>
                            </div>
                        </div>
                    </div>

                    <MapHUD threatIndex={threatIndex} />
                </div>

                {/* Bottom Section: Live Log & Stats */}
                <div className="flex justify-between items-end gap-8">
                    <div className="w-1/3 pointer-events-auto">
                        <HUDPanel className="p-4 border-white/10 mb-4 bg-black/60 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} className="text-blue-400" /> Time Travel Playback
                                </h4>
                                <button
                                    onClick={() => setIsPlaybackRunning(!isPlaybackRunning)}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                    {isPlaybackRunning ? <Pause size={14} className="text-blue-400" /> : <Play size={14} className="text-emerald-400" />}
                                </button>
                            </div>
                            <input
                                type="range"
                                min={transactions.length > 0 ? Math.min(...transactions.map(t => t.timestamp)) : 0}
                                max={transactions.length > 0 ? Math.max(...transactions.map(t => t.timestamp)) : 100}
                                value={playbackTime || (transactions.length > 0 ? Math.max(...transactions.map(t => t.timestamp)) : 100)}
                                onChange={(e) => setPlaybackTime(parseInt(e.target.value))}
                                className="w-full accent-blue-500 bg-white/5"
                            />
                            <div className="flex justify-between mt-1 text-[8px] font-mono text-slate-500">
                                <span>HISTORICAL</span>
                                <span className="text-blue-400">{playbackTime ? new Date(playbackTime).toLocaleTimeString() : 'LIVE'}</span>
                                <span>CURRENT</span>
                            </div>
                        </HUDPanel>

                        <HUDPanel className="p-4 border-white/10 mb-4 bg-black/60 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Filters</h4>
                                <Activity size={12} className="text-blue-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Min Risk Score</label>
                                    <input
                                        type="range" min="0" max="100" value={filters.minScore}
                                        onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                                        className="w-full accent-blue-500 bg-white/5"
                                    />
                                    <div className="text-[10px] font-mono text-white mt-1">{filters.minScore}%</div>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Region focus</label>
                                    <select
                                        value={filters.region}
                                        onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 text-[10px] text-white p-1 rounded font-black outline-none"
                                    >
                                        <option value="Global">ALL_PLANETARY</option>
                                        <option value="USA">NORTH_AMERICA</option>
                                        <option value="France">EUROPE_C1</option>
                                        <option value="Japan">ASIA_EAST</option>
                                    </select>
                                </div>
                            </div>
                        </HUDPanel>

                        <HUDPanel className="p-0 border-blue-500/30">
                            <div className="p-4 border-b border-white/5 bg-blue-600/5 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Terminal size={14} className="text-blue-400" /> INGRESS_TRANSACTION_STREAM
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase">Live</span>
                            </div>
                            <div className="h-48 overflow-y-auto p-4 space-y-2 font-mono scrollbar-none">
                                {transactions.length === 0 && (
                                    <div className="text-slate-600 text-[10px]">WAITING_FOR_DATA_LINK...</div>
                                )}
                                {transactions.map(t => (
                                    <div key={t.transactionId} className="flex items-center gap-3 text-[9px] hover:bg-white/5 p-1 rounded transition-colors group">
                                        <span className="text-slate-500">[{new Date(t.timestamp).toLocaleTimeString()}]</span>
                                        <span className="text-blue-400 font-bold">{t.transactionId}</span>
                                        <span className="text-slate-200">{t.city}, {t.country}</span>
                                        <span className={`ml-auto font-black ${t.fraudScore > 0.8 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                                            {(t.fraudScore * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </HUDPanel>
                    </div>

                    {/* Right Bottom: Mode Controls */}
                    <div className="flex flex-col gap-4 items-end pointer-events-auto">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600/20 hover:border-blue-500/50 transition-all group backdrop-blur-md"
                            >
                                <Layers className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                                <span className="sr-only">Toggle Map View</span>
                            </button>
                            <button
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-red-600/20 hover:border-red-500/50 transition-all group backdrop-blur-md"
                            >
                                <ShieldAlert className="text-red-400 group-hover:scale-110 transition-transform" size={24} />
                                <span className="sr-only">Emergency Triage</span>
                            </button>
                        </div>

                        <HUDPanel className="w-64 border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordinate Link</h4>
                                <Crosshair size={14} className="text-blue-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Arcs</span>
                                    <span className="text-[10px] font-black text-white">{arcs.length}</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(arcs.length / 20) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </HUDPanel>
                    </div>
                </div>
            </div>

            <ForensicReportOverlay
                isOpen={reportData.isOpen}
                onClose={() => setReportData(prev => ({ ...prev, isOpen: false }))}
                reportContent={reportData.content}
                txId={reportData.txId}
            />
        </div>
    );
};
