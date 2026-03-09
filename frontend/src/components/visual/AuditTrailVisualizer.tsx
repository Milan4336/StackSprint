import { motion } from 'framer-motion';
import { History, Search, FileText, CheckCircle, Clock } from 'lucide-react';

interface AuditEvent {
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    details: string;
    status: 'success' | 'warning' | 'info';
}

export const AuditTrailVisualizer = ({ events }: { events: AuditEvent[] }) => {
    return (
        <div className="flex flex-col h-full bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <History size={16} className="text-blue-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Live Forensic Audit Trail</h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500">REALTIME</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {events.map((event, idx) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative pl-6 border-l border-slate-800 pb-4 last:pb-0"
                    >
                        {/* Timeline Connector */}
                        <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-slate-700 border border-slate-900" />

                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 mb-1">{event.timestamp}</p>
                                <p className="text-xs font-black text-slate-200 uppercase tracking-tight">{event.action}</p>
                                <p className="text-[10px] text-slate-400 mt-1 italic italic">Actor: {event.actor}</p>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${event.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                    event.status === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                {event.status}
                            </div>
                        </div>
                        <div className="mt-2 p-2 bg-slate-950/50 rounded-lg border border-slate-800/50 text-[10px] text-slate-300 antialiased">
                            {event.details}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950/30">
                <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase text-slate-300 transition-colors">
                    <FileText size={12} /> Export Forensic Log
                </button>
            </div>
        </div>
    );
};
