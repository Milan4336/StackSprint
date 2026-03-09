import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L, { divIcon } from 'leaflet';
import 'leaflet.heat';
import 'leaflet.markercluster';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useThreatStore } from '../../store/threatStore';
import { Transaction } from '../../types';
import { formatSafeDate, safeDate } from '../../utils/date';
import { GeoTrajectoryOverlay } from '../visual/GeoTrajectoryOverlay';
import { HUDCard } from '../layout/HUDCard';
import { HUDDataReadout } from '../visual/HUDDecorations';
import { useUISound } from '../../hooks/useUISound';
import { Activity, ShieldAlert, Globe, Crosshair, Terminal } from 'lucide-react';
import { useThemeStore, ThemeType } from '../../store/themeStore';
import { HUDPanel, HUDCorner, HUDScanline } from '../visual/HUDDecorations';

interface FraudRadarMapProps {
  transactions: Transaction[];
  heightClass?: string;
}

type TimePreset = '10m' | '1h' | '24h' | 'custom';
type DeviceBadge = 'trusted' | 'new' | 'high';

interface DeviceMeta {
  isNewDevice: boolean;
  deviceRiskScore: number;
  previousLocation: string;
  previousTime: string;
  badge: DeviceBadge;
}

interface RadarPoint {
  tx: Transaction;
  coords: [number, number];
  meta: DeviceMeta;
}

interface GeoPath {
  id: string;
  from: [number, number];
  to: [number, number];
  userId: string;
  distanceKm: number;
  hoursDiff: number;
  tx: Transaction;
}

const locationMap: Record<string, [number, number]> = {
  ny: [40.7128, -74.006],
  newyork: [40.7128, -74.006],
  ca: [36.7783, -119.4179],
  california: [36.7783, -119.4179],
  tx: [31.9686, -99.9018],
  texas: [31.9686, -99.9018],
  fl: [27.6648, -81.5158],
  florida: [27.6648, -81.5158],
  wa: [47.7511, -120.7401],
  washington: [47.7511, -120.7401],
  london: [51.5072, -0.1276],
  delhi: [28.6139, 77.209],
  tokyo: [35.6762, 139.6503],
  dubai: [25.2048, 55.2708],
  sydney: [-33.8688, 151.2093]
};

const normalizeLocation = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '');

const isValidCoordinates = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const toLocalDateTimeValue = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const haversineKm = (from: [number, number], to: [number, number]): number => {
  const earthRadius = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(to[0] - from[0]);
  const dLon = toRad(to[1] - from[1]);
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const coordsForTransaction = (tx: Transaction): [number, number] | null => {
  if (typeof tx.latitude === 'number' && typeof tx.longitude === 'number' && isValidCoordinates(tx.latitude, tx.longitude)) return [tx.latitude, tx.longitude];
  return locationMap[normalizeLocation(tx.location)] ?? null;
};

const buildPopupHtml = (point: RadarPoint, themeColors: any): string => {
  const { tx, meta } = point;
  const isCritical = tx.fraudScore > 80;
  const accent = isCritical ? themeColors.critical : themeColors.primary;

  return `
    <div style="background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(12px); padding: 16px; color: #fff; font-family: 'JetBrains Mono', monospace; min-width: 220px; border: 1px solid ${accent}40; border-radius: 4px; box-shadow: 0 0 30px rgba(0,0,0,0.5);">
      <div style="position: absolute; top:0; right:0; width: 10px; height: 10px; border-top: 2px solid ${accent}; border-right: 2px solid ${accent};"></div>
      <div style="font-size: 8px; color: ${accent}; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 6px; font-weight: 900;">SIGNAL_DETECTED</div>
      <div style="font-size: 15px; font-weight: 900; margin-bottom: 12px; letter-spacing: -0.05em; color: #fff;">ID_${tx.transactionId.slice(0, 8)}</div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 4px;">
        <div style="color: #64748b; font-weight: 900;">RISK</div><div style="text-align: right; color: ${accent}; font-weight: 900;">${tx.fraudScore}%</div>
        <div style="color: #64748b; font-weight: 900;">VAL</div><div style="text-align: right; color: #fff;">$${tx.amount.toLocaleString()}</div>
      </div>
      
      <div style="margin-top: 12px; font-size: 9px; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
        <span style="width: 4px; height: 4px; border-radius: 50%; background: ${accent};"></span>
        <span>LOCATION: ${tx.location.toUpperCase()}</span>
      </div>
    </div>
  `;
};

const markerIconFor = (score: number, themeColors: any): L.DivIcon => {
  const color = score > 70 ? themeColors.critical : score > 40 ? themeColors.secondary : themeColors.primary;
  const pulse = score > 70 ? 'animate-ping' : '';

  return divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute h-8 w-8 rounded-full ${pulse} opacity-20" style="background: ${color}"></div>
        <div class="relative h-3 w-3 rounded-full border border-white/40" style="background: ${color}; box-shadow: 0 0 15px ${color}"></div>
      </div>
    `,
    className: 'radar-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

interface MapLayersProps {
  points: RadarPoint[];
  paths: GeoPath[];
  showHeatmap: boolean;
  showMarkers: boolean;
  showPaths: boolean;
  incidentMode: boolean;
  themeColors: any;
}

const MapLayers = ({ points, paths, showHeatmap, showMarkers, showPaths, incidentMode, themeColors }: MapLayersProps) => {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterRef = useRef<any>(null);
  const heatRef = useRef<any>(null);
  const pathsRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 40,
        polygonOptions: { fillColor: themeColors.primary, color: themeColors.primary, weight: 1, opacity: 0.2, fillOpacity: 0.1 }
      });
      map.addLayer(clusterRef.current);
    }

    if (!pathsRef.current) {
      pathsRef.current = L.layerGroup();
      map.addLayer(pathsRef.current);
    }

    if (showMarkers) {
      for (const point of points) {
        if (markersRef.current.has(point.tx.transactionId)) continue;
        const marker = L.marker(point.coords, { icon: markerIconFor(point.tx.fraudScore, themeColors) });
        marker.bindPopup(buildPopupHtml(point, themeColors));
        clusterRef.current.addLayer(marker);
        markersRef.current.set(point.tx.transactionId, marker);
      }
    }

    if (showHeatmap) {
      const heatData = points.map(p => [p.coords[0], p.coords[1], Math.max(0.1, Math.min(1, p.tx.fraudScore / 100))]);
      if (!heatRef.current) {
        heatRef.current = (L as any).heatLayer(heatData, { radius: 20, blur: 15, minOpacity: 0.4, gradient: { 0.4: themeColors.primary, 0.6: themeColors.secondary, 0.9: themeColors.critical } });
        map.addLayer(heatRef.current);
      } else {
        heatRef.current.setLatLngs(heatData);
      }
    }
  }, [points, showMarkers, showHeatmap, incidentMode, map]);

  return null;
};

export const FraudRadarMap = memo(({ transactions, heightClass = 'h-[600px]' }: FraudRadarMapProps) => {
  const deferredTransactions = useDeferredValue(transactions);
  const incidentMode = useThreatStore((state) => state.threatLevel === 'CRITICAL');
  const { playSound } = useUISound();
  const { theme } = useThemeStore();

  const themeColors = useMemo(() => {
    const colors: Record<ThemeType, { primary: string; secondary: string; critical: string; accent: string; shadow: string; bgButton: string }> = {
      cyber: { primary: '#3b82f6', secondary: '#f59e0b', critical: '#ef4444', accent: 'text-blue-400', shadow: 'rgba(37,99,235,0.4)', bgButton: 'bg-blue-600' },
      neon: { primary: '#a855f7', secondary: '#f472b6', critical: '#ef4444', accent: 'text-purple-400', shadow: 'rgba(168,85,247,0.4)', bgButton: 'bg-purple-600' },
      tactical: { primary: '#10b981', secondary: '#facc15', critical: '#3b82f6', accent: 'text-emerald-400', shadow: 'rgba(16,185,129,0.4)', bgButton: 'bg-emerald-600' }
    };
    return colors[theme] || colors.cyber;
  }, [theme]);

  const [timePreset, setTimePreset] = useState<TimePreset>('1h');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showPaths, setShowPaths] = useState(true);

  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    let fromMs = 0;
    if (timePreset === '10m') fromMs = now - 10 * 60 * 1000;
    else if (timePreset === '1h') fromMs = now - 60 * 60 * 1000;
    else if (timePreset === '24h') fromMs = now - 24 * 60 * 60 * 1000;

    return deferredTransactions.filter(tx => (safeDate(tx.timestamp)?.getTime() || 0) >= fromMs);
  }, [deferredTransactions, timePreset]);

  const { points, paths, highRiskCount, fraudDensityScore, mostTargetedCountry } = useMemo(() => {
    const pointsBuffer: RadarPoint[] = [];
    const userPaths: GeoPath[] = [];
    const countryCounts = new Map<string, number>();

    filteredTransactions.forEach(tx => {
      const coords = coordsForTransaction(tx);
      if (coords) {
        pointsBuffer.push({ tx, coords, meta: { isNewDevice: false, deviceRiskScore: 0, previousLocation: '', previousTime: '', badge: 'trusted' } });
        const c = tx.country || 'N/A';
        countryCounts.set(c, (countryCounts.get(c) || 0) + 1);
      }
    });

    // Simple path simulation for Suspicious Geo Jump
    filteredTransactions.filter(t => t.geoVelocityFlag).slice(0, 10).forEach(tx => {
      const to = coordsForTransaction(tx);
      if (to) {
        userPaths.push({ id: tx.transactionId, from: [to[0] - 10, to[1] - 10], to, userId: tx.userId, distanceKm: 2000, hoursDiff: 1, tx });
      }
    });

    const highRisk = pointsBuffer.filter(p => p.tx.fraudScore > 75).length;
    return { points: pointsBuffer, paths: userPaths, highRiskCount: highRisk, fraudDensityScore: pointsBuffer.length ? Math.round((highRisk / pointsBuffer.length) * 100) : 0, mostTargetedCountry: 'N/A' };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 bg-white/5 p-1 rounded-sm border border-white/10">
          {['10m', '1h', '24h'].map(p => (
            <button key={p} onClick={() => { playSound('CLICK'); setTimePreset(p as TimePreset); }} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${timePreset === p ? `${themeColors.bgButton} text-white shadow-[0_0_10px_${themeColors.shadow}]` : 'text-slate-500 hover:text-slate-300'}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHeatmap(!showHeatmap)} className={`w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm bg-black/40 ${showHeatmap ? `${themeColors.accent} border-${themeColors.accent.replace('text-', '')}/50 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]` : 'opacity-40 hover:opacity-100'}`}><Activity size={18} /></button>
          <button onClick={() => setShowMarkers(!showMarkers)} className={`w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm bg-black/40 ${showMarkers ? `${themeColors.accent} border-${themeColors.accent.replace('text-', '')}/50 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]` : 'opacity-40 hover:opacity-100'}`}><Crosshair size={18} /></button>
          <button onClick={() => setShowPaths(!showPaths)} className={`w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm bg-black/40 ${showPaths ? `${themeColors.accent} border-${themeColors.accent.replace('text-', '')}/50 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]` : 'opacity-40 hover:opacity-100'}`}><Globe size={18} /></button>
        </div>
      </div>

      <div className={`relative rounded-lg border border-white/10 bg-black/60 overflow-hidden ${heightClass} hud-panel`}>
        <HUDScanline />
        <HUDCorner position="top-right" />
        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full z-0 grayscale-[0.8] contrast-[1.2] opacity-80">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />
          <MapLayers points={points} paths={paths} showHeatmap={showHeatmap} showMarkers={showMarkers} showPaths={showPaths} incidentMode={incidentMode} themeColors={themeColors} />
          {showPaths && <GeoTrajectoryOverlay trajectories={paths.map(p => ({ from: p.from, to: p.to, risk: (p.tx.fraudScore || 0) / 100 }))} />}
        </MapContainer>

        {/* Tactical HUD Overlay for Map */}
        <div className="absolute top-6 right-6 z-[500] space-y-4 pointer-events-none">
          <div className="hud-panel !bg-black/80 border-white/10 p-4 w-64 backdrop-blur-xl">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${themeColors.accent} mb-3 block`}>Grid_Optimization</span>
            <div className="space-y-4">
              <HUDDataReadout label="Density_Vector" value={`${fraudDensityScore}%`} />
              <HUDDataReadout label="Active_Clusters" value={`${highRiskCount}`} />
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${fraudDensityScore}%` }} className={`h-full ${themeColors.bgButton}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-10 left-10 z-[500] flex gap-6 px-6 py-3 bg-black/80 backdrop-blur-xl rounded-sm border border-white/10 text-[9px] font-black uppercase tracking-[0.3em] pointer-events-none shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full" style={{ background: themeColors.primary, boxShadow: `0 0 10px ${themeColors.primary}` }} /> NOMINAL</div>
          <div className="flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full" style={{ background: themeColors.secondary, boxShadow: `0 0 10px ${themeColors.secondary}` }} /> ELEVATED</div>
          <div className="flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full" style={{ background: themeColors.critical, boxShadow: `0 0 10px ${themeColors.critical}` }} /> CRITICAL</div>
        </div>
      </div>
    </div>
  );
});
