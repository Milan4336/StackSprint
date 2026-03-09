import { motion } from 'framer-motion';
import { History, ShieldCheck, AlertTriangle, MapPin, Globe } from 'lucide-react';
import { format } from 'date-fns';

export const PortalLogins = ({ logs }: { logs: any[] }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg italic">Access Logs</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Node Ingress/Egress Surveillance</p>
                </div>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                    <ShieldCheck size={12} /> Live Monitoring Active
                </div>
            </div>

            <div className="space-y-2">
                {logs.map((log, idx) => {
                    const isSuspicious = log.metadata?.riskScore > 50;

                    return (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`p-2.5 rounded-lg bg-black/40 border border-white/5 ${isSuspicious ? 'text-red-500' : 'text-slate-500'}`}>
                                    <History size={16} />
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                    <div className="min-w-[120px]">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Event Type</p>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Authentication</p>
                                    </div>
                                    <div className="min-w-[140px]">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Timestamp</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                                        </p>
                                    </div>
                                    <div className="min-w-[120px]">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Source IP</p>
                                        <div className="flex items-center gap-1.5">
                                            <Globe size={10} className="text-slate-600" />
                                            <span className="text-[10px] font-black text-white tracking-widest">{log.ipAddress || '127.0.0.1'}</span>
                                        </div>
                                    </div>
                                    <div className="min-w-[100px]">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Location</p>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={10} className="text-slate-600" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{log.metadata?.location || 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${isSuspicious ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                    }`}>
                                    {isSuspicious ? 'Flagged' : 'Secure'}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};
