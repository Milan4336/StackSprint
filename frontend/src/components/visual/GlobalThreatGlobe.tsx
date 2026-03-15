import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { useActionsSlice } from '../../store/slices/actionsSlice';
import { useThreatStore } from '../../store/threatStore';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../../api/client';

// Generate some pseudo-random coordinates based on a string (like userId)
const hashStrToCoord = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = (hash % 180) - 90;
    const lng = ((hash >> 8) % 360) - 180;
    return { lat, lng };
};

export const GlobalThreatGlobe = () => {
    const globeRef = useRef<any>();
    const { actions } = useActionsSlice();
    const threatIndex = useThreatStore((state: any) => state.threatIndex);

    const [arcsData, setArcsData] = useState<any[]>([]);
    const [ringsData, setRingsData] = useState<any[]>([]);
    const [customPoints, setCustomPoints] = useState<any[]>([]);

    // Fetch real geo-intensity data for the globe points
    const { data: geoData } = useQuery({
        queryKey: ['global-geo-intensity'],
        queryFn: () => monitoringApi.getGeoIntensity(),
        refetchInterval: 10000
    });

    const gData = useMemo(() => {
        if (!geoData) return [];
        return geoData.map((point: any) => ({
            lat: point.lat,
            lng: point.lng,
            size: point.risk * 0.8 + 0.2, // Increased size for visibility
            color: point.risk > 0.85 ? '#ff0000' : point.risk > 0.6 ? '#ef4444' : '#f59e0b',
            risk: point.risk,
            label: `Risk Node: ${Math.round(point.risk * 100)}%`
        }));
    }, [geoData]);

    // "Drone" markers for extensive information
    const droneMarkers = useMemo(() => actions.map(action => {
        const endNode = hashStrToCoord(action.userId + 'end');
        return {
            lat: endNode.lat,
            lng: endNode.lng,
            size: 1.5,
            color: '#06b6d4',
            isDrone: true,
            label: `[SYSTEM_UNIT_${action.userId.slice(0,4)}]\nTASK: ${action.type.toUpperCase()}\nSEVERITY: ${action.severity.toUpperCase()}\nSTATUS: ENGAGED`
        };
    }), [actions]);

    useEffect(() => {
        // Map recent autonomous actions to arc trajectories
        if (actions.length > 0) {
            const newArcs = actions.map(action => {
                const startNode = hashStrToCoord(action.userId + 'start');
                const endNode = hashStrToCoord(action.userId + 'end');
                return {
                    startLat: startNode.lat,
                    startLng: startNode.lng,
                    endLat: endNode.lat,
                    endLng: endNode.lng,
                    color: action.severity === 'critical' ? ['#ef4444', '#f87171'] : ['#3b82f6', '#60a5fa'],
                    name: `Vector: ${action.userId.slice(0, 8)}`
                };
            });

            const newRings = actions.map(action => {
                const endNode = hashStrToCoord(action.userId + 'end');
                return {
                    lat: endNode.lat,
                    lng: endNode.lng,
                    color: action.severity === 'critical' ? '#ef4444' : '#3b82f6',
                    maxR: 12,
                    propagationSpeed: 4,
                    repeatPeriod: 1000
                } as any;
            });

            setArcsData(newArcs.slice(0, 20));
            setRingsData(newRings.slice(0, 15));
        }
    }, [actions]);

    useEffect(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = threatIndex > 60 ? 1.5 : 0.5;
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }
    }, [threatIndex]);

    const combinedPoints = useMemo(() => [...gData, ...droneMarkers], [gData, droneMarkers]);

    return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
            <Globe
                ref={globeRef}
                width={700}
                height={700}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                atmosphereColor={threatIndex > 70 ? "#ef4444" : "#3b82f6"}
                atmosphereAltitude={0.15}
                pointsData={combinedPoints}
                pointColor="color"
                pointAltitude={(d: any) => d.isDrone ? 0.15 : 0.01}
                pointRadius="size"
                pointsMerge={false}
                pointLabel="label"
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcStroke={0.4}
                arcDashAnimateTime={1500}
                arcLabel="name"
                ringsData={ringsData}
                ringColor="color"
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                enablePointerInteraction={true}
                showAtmosphere={true}
            />
            
            {/* Holographic Cinematic HUD - Top Left */}
            <div className="absolute top-10 left-10 pointer-events-none font-mono">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Orbital Guard: Active</div>
                </div>
                <div className="space-y-1 opacity-60">
                    <div className="text-[8px] text-cyan-500/80">LATENCY: 14ms</div>
                    <div className="text-[8px] text-cyan-500/80">BEAMS: LOCK_ON</div>
                    <div className="text-[8px] text-cyan-500/80">UID: ARGUS-01</div>
                </div>
            </div>

            {/* Holographic Cinematic HUD - Bottom Right */}
            <div className="absolute bottom-10 right-10 pointer-events-none font-mono text-right">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">Threat Matrix</div>
                <div className="space-y-1 opacity-60">
                    <div className="text-[8px] text-red-400">NODES_SCANNING: {gData.length}</div>
                    <div className="text-[8px] text-red-400">DRONES_DEPLOYED: {droneMarkers.length}</div>
                    <div className="text-[8px] text-red-400">RISK_ALTITUDE: {threatIndex}%</div>
                </div>
            </div>

            {/* Center Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
                <div className="w-96 h-96 border border-blue-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-[450px] h-[450px] border border-dashed border-blue-500/10 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
            </div>
            {/* Predictive "Pre-Crime" HUD - Top Right */}
            <div className="absolute top-10 right-10 pointer-events-none font-mono text-right">
                <div className="flex items-center gap-2 justify-end mb-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Predictive Burst Window</div>
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <div className="space-y-1 opacity-60">
                    <div className="text-[8px] text-amber-500/80">PROBABILITY: 78.4%</div>
                    <div className="text-[8px] text-amber-500/80">TARGET: APAC_REG_02</div>
                    <div className="text-[8px] text-amber-500/80">ETA: 02:14:00</div>
                </div>
            </div>

            {/* Cinematic Overlay HUD - Left Side Vertical Readout */}
            <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none font-mono space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 skew-x-12">
                        <div className="h-10 w-[2px] bg-cyan-500/20" />
                        <div className="text-[6px] text-cyan-400/40 rotate-90 leading-none">SECTOR_{100 + i}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};