import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SystemBootIntroProps {
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const BOOT_MESSAGES = [
  'Connecting to transaction stream...',
  'Initializing fraud detection engine...',
  'Loading ML risk model...',
  'Connecting to realtime monitoring...',
  'Verifying system integrity...',
  'Fraud command center ready'
] as const;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const SystemBootIntro = ({ onComplete }: SystemBootIntroProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasCompletedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const messageStartMs = 460;
    const messageStepMs = 360;
    const progressDurationMs = 2800;
    const readyAtMs = 3000;
    const totalDurationMs = 3450;
    const startedAt = performance.now();

    let rafId = 0;
    const frame = (now: number) => {
      const elapsed = now - startedAt;
      setProgress(clamp((elapsed / progressDurationMs) * 100, 0, 100));

      const count =
        elapsed < messageStartMs
          ? 0
          : Math.min(BOOT_MESSAGES.length, Math.floor((elapsed - messageStartMs) / messageStepMs) + 1);
      setVisibleMessageCount(count);

      if (elapsed >= readyAtMs) {
        setIsReady(true);
      }

      if (elapsed >= totalDurationMs) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete();
        }
        return;
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0;
    let height = 0;
    let rafId = 0;
    let particles: Particle[] = [];

    const initializeParticles = () => {
      const count = Math.max(45, Math.min(90, Math.floor((width * height) / 28000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.8 + 0.8
      }));
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      initializeParticles();
    };

    const drawFrame = () => {
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(2, 6, 23, 0.98)');
      gradient.addColorStop(0.45, 'rgba(3, 10, 30, 0.92)');
      gradient.addColorStop(1, 'rgba(8, 21, 52, 0.86)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j += 1) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 150) continue;

          const alpha = 1 - distance / 150;
          context.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.22})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(p1.x, p1.y);
          context.lineTo(p2.x, p2.y);
          context.stroke();
        }
      }

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x <= 0 || particle.x >= width) particle.vx *= -1;
        if (particle.y <= 0 || particle.y >= height) particle.vy *= -1;

        context.beginPath();
        context.fillStyle = 'rgba(147, 197, 253, 0.85)';
        context.shadowBlur = 14;
        context.shadowColor = 'rgba(56, 189, 248, 0.45)';
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      context.shadowBlur = 0;
      rafId = requestAnimationFrame(drawFrame);
    };

    resize();
    drawFrame();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const visibleMessages = useMemo(() => BOOT_MESSAGES.slice(0, visibleMessageCount), [visibleMessageCount]);

  return (
    <motion.div
      className="fixed inset-0 z-[140] overflow-hidden bg-slate-950/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_42%),radial-gradient(circle_at_80%_18%,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_50%_88%,rgba(239,68,68,0.15),transparent_45%)]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-blue-200/90"
        >
          Initializing Platform
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="boot-glow text-4xl font-black tracking-tight text-slate-50 sm:text-5xl"
        >
          FRAUD COMMAND CENTER
        </motion.h1>

        <div className="glass-panel mt-8 max-w-3xl rounded-2xl border border-blue-400/25 bg-slate-950/45 p-5">
          <div className="space-y-2 font-mono text-sm text-blue-100/90">
            <AnimatePresence>
              {visibleMessages.map((line) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-cyan-300">{'>'}</span>
                  <span>{line}</span>
                </motion.p>
              ))}
            </AnimatePresence>

            {!isReady ? (
              <p className="flex items-center gap-2 text-blue-200/70">
                <span className="text-cyan-300">{'>'}</span>
                <span className="boot-cursor">_</span>
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/95">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear', duration: 0.12 }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-300/80">
              <span>System Bootstrap</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          <AnimatePresence>
            {isReady ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200"
              >
                SYSTEM READY
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
