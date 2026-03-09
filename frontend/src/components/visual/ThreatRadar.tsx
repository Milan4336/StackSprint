import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../../services/socket';

interface RadarDot {
    id: number;
    x: number; // 0-100
    y: number; // 0-100
    intensity: number; // 0-1
    color: string;
    born: number;
}

const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 10;
const RING_COUNT = 4;
const DOT_LIFETIME_MS = 4000;

/**
 * ThreatRadar — SVG rotating sweep radar with fraud dots.
 * Dots appear for high-risk transactions from transactions.live.
 * Covers Features 19 (Fraud Origin Radar Sweep), 28 (Fraud Probability Particles).
 */
export const ThreatRadar = () => {
    const [angle, setAngle] = useState(0);
    const [dots, setDots] = useState<RadarDot[]>([]);
    const dotIdRef = useRef(0);
    const animFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);

    // Rotate sweep
    useEffect(() => {
        const step = (now: number) => {
            const delta = now - lastTimeRef.current;
            lastTimeRef.current = now;
            setAngle((prev) => (prev + delta * 0.12) % 360);
            animFrameRef.current = requestAnimationFrame(step);
        };
        animFrameRef.current = requestAnimationFrame(step);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    // Listen for high-risk transactions
    useEffect(() => {
        const socket = getSocket();
        const handler = (payload: { fraudScore?: number; isFraud?: boolean; location?: string }) => {
            const score = Number(payload.fraudScore ?? 0);
            if (score < 50) return;

            // Place dot at random position on radar
            const r = (0.3 + Math.random() * 0.65) * RADIUS;
            const a = Math.random() * Math.PI * 2;
            const id = ++dotIdRef.current;
            const dot: RadarDot = {
                id,
                x: CENTER + Math.cos(a) * r,
                y: CENTER + Math.sin(a) * r,
                intensity: score / 100,
                color: score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : '#eab308',
                born: Date.now(),
            };
            setDots((prev) => [...prev.slice(-20), dot]);

            // Clean up after lifetime
            setTimeout(() => {
                setDots((prev) => prev.filter((d) => d.id !== id));
            }, DOT_LIFETIME_MS);
        };

        socket.on('transactions.live', handler);
        return () => { socket.off('transactions.live', handler); };
    }, []);

    const sweepPath = `M ${CENTER},${CENTER} L ${CENTER + Math.cos((angle - 90) * Math.PI / 180) * RADIUS},${CENTER + Math.sin((angle - 90) * Math.PI / 180) * RADIUS}`;

    return (
        <div className="flex flex-col items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Fraud Radar</p>
            <svg width={SIZE} height={SIZE} className="overflow-visible">
                <defs>
                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <linearGradient id="sweepGrad" x1={`${CENTER}px`} y1={`${CENTER}px`}
                        x2={`${CENTER + Math.cos((angle - 90) * Math.PI / 180) * RADIUS}px`}
                        y2={`${CENTER + Math.sin((angle - 90) * Math.PI / 180) * RADIUS}px`}
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="rgba(34,197,94,0.6)" />
                        <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                    </linearGradient>
                </defs>

                {/* Background fill */}
                <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#radarGlow)" stroke="rgba(148,163,184,0.1)" strokeWidth={1} />

                {/* Concentric rings */}
                {Array.from({ length: RING_COUNT }).map((_, i) => (
                    <circle
                        key={i}
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS * ((i + 1) / RING_COUNT)}
                        fill="none"
                        stroke="rgba(148,163,184,0.08)"
                        strokeWidth={0.8}
                    />
                ))}

                {/* Crosshair */}
                <line x1={10} y1={CENTER} x2={SIZE - 10} y2={CENTER} stroke="rgba(148,163,184,0.08)" strokeWidth={0.5} />
                <line x1={CENTER} y1={10} x2={CENTER} y2={SIZE - 10} stroke="rgba(148,163,184,0.08)" strokeWidth={0.5} />

                {/* Sweep sector */}
                <motion.path
                    d={`M${CENTER},${CENTER} L${CENTER + Math.cos((angle - 90 - 40) * Math.PI / 180) * RADIUS},${CENTER + Math.sin((angle - 90 - 40) * Math.PI / 180) * RADIUS} A${RADIUS},${RADIUS},0,0,1,${CENTER + Math.cos((angle - 90) * Math.PI / 180) * RADIUS},${CENTER + Math.sin((angle - 90) * Math.PI / 180) * RADIUS} Z`}
                    fill="rgba(34,197,94,0.07)"
                    animate={{ d: sweepPath }}
                />

                {/* Sweep line */}
                <line
                    x1={CENTER}
                    y1={CENTER}
                    x2={CENTER + Math.cos((angle - 90) * Math.PI / 180) * RADIUS}
                    y2={CENTER + Math.sin((angle - 90) * Math.PI / 180) * RADIUS}
                    stroke="rgba(34,197,94,0.8)"
                    strokeWidth={1.5}
                />

                {/* Fraud dots */}
                {dots.map((dot) => {
                    const age = (Date.now() - dot.born) / DOT_LIFETIME_MS;
                    return (
                        <g key={dot.id}>
                            <circle cx={dot.x} cy={dot.y} r={4 + dot.intensity * 3} fill={dot.color} opacity={1 - age * 0.7} />
                            <circle cx={dot.x} cy={dot.y} r={8 + dot.intensity * 5} fill="none" stroke={dot.color} strokeWidth={0.8} opacity={(1 - age) * 0.5} />
                        </g>
                    );
                })}

                {/* Center dot */}
                <circle cx={CENTER} cy={CENTER} r={3} fill="rgba(34,197,94,0.9)" />
            </svg>
        </div>
    );
};
