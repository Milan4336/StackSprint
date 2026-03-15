import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Shield, Zap, Database, Cpu, Layout, Activity, Code, ChevronDown } from 'lucide-react';

// Re-using the same Globe icon as Sidebar
const Globe = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';

export const Updates = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const query = useQuery({
        queryKey: ['system-updates'],
        queryFn: () => monitoringApi.getSystemUpdates(),
        staleTime: 5 * 60 * 1000
    });

    const updatesResponse = [...(query.data || [])].sort((a, b) =>
        b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' })
    );

    const toneFrom = (color?: string) => {
        const key = (color || '').toLowerCase();
        if (key.includes('red') || key.includes('rose')) {
            return { color: 'var(--status-danger)' };
        }
        if (key.includes('amber') || key.includes('orange') || key.includes('yellow')) {
            return { color: 'var(--status-warning)' };
        }
        if (key.includes('green') || key.includes('emerald')) {
            return { color: 'var(--status-success)' };
        }
        return { color: 'var(--accent)' };
    };

    return (
        <div className="space-y-8 pb-12">
            <header>
                <h2 className="theme-page-title">Platform Evolution</h2>
                <p className="theme-page-subtitle font-medium">
                    Chronological record of system upgrades and forensic capability enhancements.
                </p>
            </header>

            <div className="relative space-y-12">
                <div
                    className="pointer-events-none absolute left-[19px] top-4 h-[calc(100%-16px)] w-0.5"
                    style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--accent) 75%, transparent), color-mix(in srgb, var(--accent) 35%, transparent), transparent)' }}
                />
                {query.isLoading ? (
                    <div className="theme-muted-text animate-pulse pl-12 text-sm font-bold">Loading system updates via API...</div>
                ) : updatesResponse.map((update, idx) => {
                    const tone = toneFrom(update.color);
                    // Match string icon name from API to actual Lucide component
                    let Icon: any = Globe;
                    if (update.icon === 'Layout') Icon = Layout;
                    if (update.icon === 'Database') Icon = Database;
                    if (update.icon === 'Cpu') Icon = Cpu;
                    if (update.icon === 'Rocket') Icon = Rocket;
                    if (update.icon === 'Zap') Icon = Zap;

                    return (
                        <motion.div
                            key={update.version}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative pl-12"
                        >
                            <div
                                className="absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-xl border shadow-xl"
                                style={{
                                    background: 'color-mix(in srgb, var(--surface-2) 90%, transparent)',
                                    borderColor: 'color-mix(in srgb, var(--surface-border) 80%, transparent)',
                                    boxShadow: '0 12px 24px -20px color-mix(in srgb, var(--accent) 85%, transparent)'
                                }}
                            >
                                <Icon size={18} style={{ color: tone.color }} />
                            </div>

                            <div
                                className="theme-surface-card group cursor-pointer border-l-2 p-5 transition-colors"
                                style={{ borderLeftColor: `color-mix(in srgb, ${tone.color} 35%, transparent)` }}
                                onClick={() => setExpandedId(expandedId === update.version ? null : update.version)}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest ring-1"
                                            style={{
                                                background: `color-mix(in srgb, ${tone.color} 12%, transparent)`,
                                                color: tone.color,
                                                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${tone.color} 30%, transparent)`
                                            }}
                                        >
                                            {update.version}
                                        </span>
                                        <p className="theme-muted-text text-xs font-bold uppercase tracking-tighter">
                                            {update.date}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase italic" style={{ color: 'var(--status-success)' }}>
                                            <Activity size={12} /> Live in Control Center
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`theme-muted-text transition-transform ${expandedId === update.version ? 'rotate-180' : ''}`}
                                            style={expandedId === update.version ? { color: tone.color } : undefined}
                                        />
                                    </div>
                                </div>

                                <h3 className="theme-strong-text mb-2 text-lg font-black">
                                    {update.title}
                                </h3>
                                <p className="theme-muted-text text-sm leading-relaxed font-medium">
                                    {update.description}
                                </p>

                                <AnimatePresence>
                                    {expandedId === update.version && update.details && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="theme-muted-text theme-divider mt-4 space-y-3 border-t pb-2 pt-4 text-sm">
                                                {update.details.split('\n').map((line: string, i: number) => {
                                                    const trimmed = line.trim();
                                                    if (!trimmed) return null;

                                                    if (trimmed.startsWith('- ')) {
                                                        const text = trimmed.substring(2);
                                                        const boldMatch = text.match(/\*\*(.*?)\*\*\s*(.*)/);
                                                        if (boldMatch) {
                                                            return (
                                                                <div key={i} className="flex gap-2 items-start">
                                                                    <span className="mt-1" style={{ color: tone.color }}>•</span>
                                                                    <p><strong className="theme-strong-text">{boldMatch[1]}</strong> {boldMatch[2]}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div key={i} className="flex gap-2 items-start">
                                                                <span className="mt-1" style={{ color: tone.color }}>•</span>
                                                                <p>{text}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return <p key={i}>{trimmed}</p>;
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="theme-muted-text mt-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                    <div className="theme-surface-subtle flex items-center gap-1.5 rounded-md px-2 py-1">
                                        <Code size={12} /> Production Build
                                    </div>
                                    <div className="theme-surface-subtle flex items-center gap-1.5 rounded-md px-2 py-1">
                                        <Shield size={12} /> Verified
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <footer
                className="theme-surface-card border-2 border-dashed p-5"
                style={{ background: 'linear-gradient(140deg, color-mix(in srgb, var(--accent) 9%, transparent), color-mix(in srgb, var(--status-success) 9%, transparent))' }}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <p className="theme-muted-text mb-1 text-[10px] font-black uppercase tracking-widest">Architecture</p>
                        <p className="theme-strong-text text-xl font-black italic">BANK-GRADE</p>
                    </div>
                    <div>
                        <p className="theme-muted-text mb-1 text-[10px] font-black uppercase tracking-widest">Protection</p>
                        <p className="theme-strong-text text-xl font-black italic">ENSEMBLE ML</p>
                    </div>
                    <div>
                        <p className="theme-muted-text mb-1 text-[10px] font-black uppercase tracking-widest">Deploy State</p>
                        <p className="text-xl font-black italic" style={{ color: 'var(--status-success)' }}>SYNCED</p>
                    </div>
                    <div>
                        <p className="theme-muted-text mb-1 text-[10px] font-black uppercase tracking-widest">Last Sync</p>
                        <p className="theme-strong-text text-xl font-black italic">LIVE</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
