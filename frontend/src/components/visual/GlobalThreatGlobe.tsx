import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { useActionsSlice } from '../../store/slices/actionsSlice';
import { useThreatStore } from '../../store/threatStore';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../../api/client';
import { useUISound } from '../../hooks/useUISound';
import { useThemeStore, ThemeType } from '../../store/themeStore';

// Tactical coordinates for "hotspots"
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
    const { theme } = useThemeStore();
    const { playSound } = useUISound();

    // Theme-based Tactical Colors
    const themeColors = useMemo(() => {
        const colors: Record<ThemeType, { primary: string; secondary: string; critical: string; atmosphere: string }> = {
            cyber: { primary: '#3b82f6', secondary: '#f59e0b', critical: '#ef4444', atmosphere: '#3b82f6' },
            neon: { primary: '#a855f7', secondary: '#f472b6', critical: '#ef4444', atmosphere: '#a855f7' },
            tactical: { primary: '#10b981', secondary: '#facc15', critical: '#3b82f6', atmosphere: '#10b981' }
        };
        return colors[theme] || colors.cyber;
    }, [theme]);

    const [arcsData, setArcsData] = useState<any[]>([]);
    const [ringsData, setRingsData] = useState<any[]>([]);

    // Fetch real geo-intensity data
    const { data: geoData } = useQuery({
        queryKey: ['global-geo-intensity'],
        queryFn: () => monitoringApi.getGeoIntensity(),
        refetchInterval: 10000
    });

    const hexData = useMemo(() => {
        if (!geoData) return [];
        return geoData.map((point: any) => ({
            lat: point.lat,
            lng: point.lng,
            size: point.risk * 1.2,
            color: point.risk > 0.8 ? themeColors.critical : point.risk > 0.5 ? themeColors.secondary : themeColors.primary
        }));
    }, [geoData, themeColors]);

    useEffect(() => {
        if (actions.length > 0) {
            const newArcs = actions.map(action => {
                const startNode = hashStrToCoord(action.userId + 'start');
                const endNode = hashStrToCoord(action.userId + 'end');
                return {
                    startLat: startNode.lat,
                    startLng: startNode.lng,
                    endLat: endNode.lat,
                    endLng: endNode.lng,
                    color: action.severity === 'critical' ? [themeColors.critical, themeColors.critical] : [themeColors.primary, themeColors.primary]
                };
            });

            const newRings = actions.map(action => {
                const endNode = hashStrToCoord(action.userId + 'end');
                return {
                    lat: endNode.lat,
                    lng: endNode.lng,
                    color: action.severity === 'critical' ? themeColors.critical : themeColors.primary,
                    maxR: 8,
                    propagationSpeed: 3,
                    repeatPeriod: 1200
                };
            });

            setArcsData(newArcs.slice(0, 20));
            setRingsData(newRings.slice(0, 15));

            // Subtle sound pulse for new activities
            if (actions.length > arcsData.length) {
                playSound('ALERT');
            }
        }
    }, [actions, playSound, arcsData.length]);

    useEffect(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.8 + (threatIndex / 100);
            controls.enableDamping = true;

            // Atmospheric Bloom Simulation
            const globeMaterial = globeRef.current.getGlobeMaterial();
            globeMaterial.color = new THREE.Color(0x0a1122);
            globeMaterial.emissive = new THREE.Color(0x001133);
            globeMaterial.emissiveIntensity = 0.2;
        }
    }, [threatIndex]);

    return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
            {/* HUD Overlay Scanlines for Globe */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

            <div className="relative z-0 pointer-events-auto h-[1000px] w-[1000px] scale-[1.2]">
                <Globe
                    ref={globeRef}
                    width={1000}
                    height={1000}
                    backgroundColor="rgba(0,0,0,0)"

                    // Holographic Styling
                    showAtmosphere={true}
                    atmosphereColor={themeColors.atmosphere}
                    atmosphereAltitude={0.25}

                    // Hex Binning for "Digital" look
                    hexBinPointsData={hexData}
                    hexBinPointWeight="size"
                    hexBinResolution={4}
                    hexTopColor={p => (p as any).color}
                    hexSideColor={() => `${themeColors.primary}33`}
                    hexBinMerge={true}
                    hexMargin={0.1}

                    // Tactical Arcs
                    arcsData={arcsData}
                    arcColor="color"
                    arcDashLength={0.6}
                    arcDashGap={0.3}
                    arcDashAnimateTime={2000}
                    arcStroke={0.5}

                    // Impact Rings
                    ringsData={ringsData}
                    ringColor="color"
                    ringMaxRadius="maxR"
                    ringPropagationSpeed="propagationSpeed"
                    ringRepeatPeriod="repeatPeriod"

                    // High-end textures
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                />
            </div>

            {/* Tactical HUD Data floating around globe */}
            <div className="absolute top-1/4 left-1/4 z-20 pointer-events-none opacity-60">
                <div className={`border-l border-t border-${theme === 'neon' ? 'purple-500' : theme === 'tactical' ? 'emerald-500' : 'blue-500'}/40 p-2 backdrop-blur-sm`}>
                    <p className={`text-[8px] font-mono ${theme === 'neon' ? 'text-purple-400' : theme === 'tactical' ? 'text-emerald-400' : 'text-blue-400'} uppercase tracking-widest`}>Sector Scan: ACTIVE</p>
                    <p className="text-[10px] font-bold text-white uppercase mt-1">G-Int-9.2</p>
                </div>
            </div>

            <div className="absolute bottom-1/4 right-1/4 z-20 pointer-events-none opacity-60">
                <div className={`border-r border-b border-${theme === 'neon' ? 'purple-500' : theme === 'tactical' ? 'emerald-500' : 'blue-500'}/40 p-2 backdrop-blur-sm text-right`}>
                    <p className={`text-[8px] font-mono ${theme === 'neon' ? 'text-purple-400' : theme === 'tactical' ? 'text-emerald-400' : 'text-blue-400'} uppercase tracking-widest`}>Vect Status: NOMINAL</p>
                    <p className="text-[10px] font-bold text-white uppercase mt-1">Relay Node-8</p>
                </div>
            </div>
        </div>
    );
};