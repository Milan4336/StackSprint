import { useEffect, useRef } from 'react';
import { useThreatStore } from '../../store/threatStore';

export const InteractiveNeuralFlow = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const threatIndex = useThreatStore(state => state.threatIndex);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const nodeCount = 15;
        const nodes: { x: number; y: number; pulse: number }[] = [];

        const resize = () => {
            canvas.width = canvas.clientWidth * window.devicePixelRatio;
            canvas.height = canvas.clientHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            nodes.length = 0;
            for (let i = 0; i < nodeCount; i++) {
                nodes.push({
                    x: Math.random() * canvas.clientWidth,
                    y: Math.random() * canvas.clientHeight,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        };

        class Particle {
            x: number;
            y: number;
            targetNodeIdx: number;
            speed: number;
            life: number;

            constructor(startIdx: number) {
                this.x = nodes[startIdx].x;
                this.y = nodes[startIdx].y;
                this.targetNodeIdx = Math.floor(Math.random() * nodes.length);
                this.speed = 2 + Math.random() * 3;
                this.life = 1;
            }

            update() {
                const target = nodes[this.targetNodeIdx];
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 5) {
                    this.life = 0;
                    return;
                }

                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = threatIndex > 70 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)';
                ctx.fill();
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Connections
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dist = Math.sqrt(Math.pow(nodes[i].x - nodes[j].x, 2) + Math.pow(nodes[i].y - nodes[j].y, 2));
                    if (dist < 200) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw Nodes
            nodes.forEach(node => {
                node.pulse += 0.05;
                const radius = 3 + Math.sin(node.pulse) * 2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = threatIndex > 70 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(30, 41, 59, 0.5)';
                ctx.fill();
                ctx.strokeStyle = threatIndex > 70 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.4)';
                ctx.stroke();
            });

            // Update & Draw Particles
            if (Math.random() < (0.1 + (threatIndex / 200))) {
                particles.push(new Particle(Math.floor(Math.random() * nodes.length)));
            }

            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => {
                p.update();
                p.draw(ctx);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [threatIndex]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.4 }}
        />
    );
};
