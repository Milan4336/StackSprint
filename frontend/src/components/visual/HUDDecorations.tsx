import { motion } from 'framer-motion';

export const HUDCorner = ({ position = 'top-left' }: { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
    const rotations = {
        'top-left': 'rotate-0',
        'top-right': 'rotate-90',
        'bottom-right': 'rotate-180',
        'bottom-left': 'rotate-270'
    };

    const placements = {
        'top-left': 'top-0 left-0',
        'top-right': 'top-0 right-0',
        'bottom-right': 'bottom-0 right-0',
        'bottom-left': 'bottom-0 left-0'
    };

    return (
        <div className={`absolute ${placements[position]} p-1 z-20 pointer-events-none`}>
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className={`${rotations[position]} text-blue-500/40`}
            >
                <path d="M1 8V1H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                <rect x="0" y="0" width="3" height="3" fill="currentColor" opacity="0.5" />
            </svg>
        </div>
    );
};

export const HUDDataReadout = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex flex-col gap-0.5 opacity-60">
        <span className="hud-readout">{label}</span>
        <motion.span
            className="font-mono text-[10px] font-black text-blue-100/90"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
        >
            {value}
        </motion.span>
    </div>
);

export const HUDScanline = () => (
    <motion.div
        className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        <motion.div
            className="w-full h-[1px] bg-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            animate={{
                top: ['0%', '100%'],
                opacity: [0, 1, 0]
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
            }}
            style={{ position: 'absolute' }}
        />
    </motion.div>
);

export const HUDPanel = ({ children, className = "", title }: { children: React.ReactNode, className?: string, title?: string }) => (
    <div className={`hud-panel group ${className}`}>
        <HUDCorner position="top-left" />
        <HUDCorner position="top-right" />
        <HUDCorner position="bottom-left" />
        <HUDCorner position="bottom-right" />
        <HUDScanline />

        {title && (
            <div className="relative z-20 mb-4 flex items-center justify-between border-l-2 border-blue-500/50 pl-3">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/80">
                    {title}
                </h3>
                <div className="h-1 w-8 bg-blue-500/20" />
            </div>
        )}

        <div className="relative z-20">
            {children}
        </div>
    </div>
);
