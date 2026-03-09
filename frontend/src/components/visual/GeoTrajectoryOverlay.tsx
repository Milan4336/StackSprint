import { useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';

interface Trajectory {
    from: [number, number];
    to: [number, number];
    risk: number;
}

export const GeoTrajectoryOverlay = ({ trajectories }: { trajectories: Trajectory[] }) => {
    const map = useMap();
    const containerRef = useRef<SVGSVGElement>(null);

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
        const midY = (p1.y + p2.y) / 2 - 50; // Curve upwards

        const d = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

        return (
            <g key={idx}>
                <motion.path
                    d={d}
                    fill="none"
                    stroke={traj.risk > 0.7 ? '#ef4444' : '#3b82f6'}
                    strokeWidth="1.5"
                    strokeDasharray="1000"
                    initial={{ strokeDashoffset: 1000 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    opacity={0.6}
                />
                <motion.circle
                    r="3"
                    fill={traj.risk > 0.7 ? '#ef4444' : '#3b82f6'}
                >
                    <animateMotion
                        dur="2.5s"
                        repeatCount="indefinite"
                        path={d}
                    />
                </motion.circle>
            </g>
        );
    };

    return (
        <div className="leaflet-pane leaflet-overlay-pane" style={{ pointerEvents: 'none' }}>
            <svg
                ref={containerRef}
                style={{ position: 'absolute' }}
                className="w-full h-full"
            >
                {trajectories.map((t, i) => renderPath(t, i))}
            </svg>
        </div>
    );
};
