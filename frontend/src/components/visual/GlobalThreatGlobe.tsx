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
            size: point.risk * 0.5 + 0.1,
            color: point.risk > 0.7 ? '#ef4444' : '#f59e0b'
        }));
    }, [geoData]);

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
                    color: action.severity === 'critical' ? ['#ef4444', '#f87171'] : ['#f59e0b', '#fbbf24']
                };
            });

            const newRings = actions.map(action => {
                const endNode = hashStrToCoord(action.userId + 'end');
                return {
                    lat: endNode.lat,
                    lng: endNode.lng,
                    color: action.severity === 'critical' ? '#ef4444' : '#f59e0b',
                    maxR: 5,
                    propagationSpeed: 2,
                    repeatPeriod: 1000
                };
            });

            setArcsData(newArcs.slice(0, 15)); // Keep max 15 arcs
            setRingsData(newRings.slice(0, 10)); // Keep max 10 rings
        }
    }, [actions]);

    useEffect(() => {
        if (globeRef.current) {
            // Configure controls for better interactivity
            const controls = globeRef.current.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = threatIndex > 60 ? 1.5 : 0.5;
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.rotateSpeed = 1.0;
            controls.zoomSpeed = 1.0;
        }
    }, [threatIndex]);

    return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-90 overflow-hidden mix-blend-screen">
            <Globe
                ref={globeRef}
                width={800}
                height={800}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                atmosphereColor="#ef4444"
                atmosphereAltitude={0.15}
                pointsData={gData}
                pointColor="color"
                pointAltitude={0}
                pointRadius="size"
                pointsMerge={true}
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={1500}
                ringsData={ringsData}
                ringColor="color"
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                enablePointerInteraction={true}
                showAtmosphere={true}
            />
        </div>
    );
};