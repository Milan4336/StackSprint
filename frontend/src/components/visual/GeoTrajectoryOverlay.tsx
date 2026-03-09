import { useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

interface Trajectory {
    from: [number, number];
    to: [number, number];
    risk: number;
}

export const GeoTrajectoryOverlay = ({ trajectories }: { trajectories: Trajectory[] }) => {
    const map = useMap();
    const containerRef = useRef<SVGSVGElement>(null);
    const { theme } = useThemeStore();

    const color = theme === 'neon' ? '#a855f7' : theme === 'tactical' ? '#10b981' : '#3b82f6';
    const criticalColor = theme === 'tactical' ? '#3b82f6' : '#ef4444';

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const bounds = map.getBounds();
                const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
                const size = map.getSize();

                containerRef.current.style.left = `${topLeft.x}px`;
                containerRef.current.style.top = `${topLeft.y}px`;
                containerRef.current.style.width = `${size.x}px`;
                containerRef.current.style.height = `${size.y}px`;
            }
        };

        map.on('move', update);
        map.on('zoom', update);
        update();

        return () => {
            map.off('move', update);
            map.off('zoom', update);
        };
    }, [map]);

    const renderPath = (traj: Trajectory, idx: number) => {
        const p1 = map.latLngToLayerPoint(traj.from);
        const p2 = map.latLngToLayerPoint(traj.to);

        // Calculate quadratic curve control point
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2 - 40;

        const d = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
        const strokeColor = traj.risk > 0.7 ? criticalColor : color;

        return (
            <g key={idx}>
                {/* Glow Effect */}
                <motion.path
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.1 }}
                    transition={{ duration: 2 }}
                    className="blur-[2px]"
                />
                <motion.path
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                />

                {/* Pulsing Dot */}
                <motion.circle r="3" fill={strokeColor} className="shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                    <animateMotion dur="2s" repeatCount="indefinite" path={d} />
                </motion.circle>

                {/* Trail Effect */}
                <motion.circle r="1.5" fill={strokeColor} opacity="0.4">
                    <animateMotion dur="2s" begin="0.2s" repeatCount="indefinite" path={d} />
                </motion.circle>
            </g>
        );
    };

    return (
        <div className="leaflet-pane leaflet-overlay-pane" style={{ pointerEvents: 'none' }}>
            <svg
                ref={containerRef}
                style={{ position: 'absolute' }}
                className="w-full h-full pointer-events-none"
            >
                {trajectories.map((t, i) => renderPath(t, i))}
            </svg>
        </div>
    );
};
