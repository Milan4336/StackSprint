import { motion } from 'framer-motion';
import { Bell, ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export const PortalAlerts = ({ alerts }: { alerts: any[] }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg italic">Security Pulse</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Real-time Threat Interception Center</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Threats:</span>
                    <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{alerts.length}</span>
                </div>
            </div>

            <div className="grid gap-4">
                {alerts.map((alert, idx) => (
                    <motion.div
                        key={alert._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-6 rounded-3xl border ${alert.status === 'open' ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
                            } relative overflow-hidden group`}
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-start gap-5">
                                <div className={`p-4 rounded-2xl bg-black/40 border ${alert.status === 'open' ? 'border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-emerald-500/30 text-emerald-500'
                                    }`}>
                                    {alert.status === 'open' ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
                                </div>
                                <div>
                                    <h4 className="text-white font-black uppercase tracking-widest text-base mb-1">{alert.reason}</h4>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{format(new Date(alert.createdAt), 'MMM dd, HH:mm:ss')}</p>
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${alert.riskLevel === 'High' ? 'text-red-500' :
                                                alert.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-500'
                                            }`}>Severity: {alert.riskLevel.toUpperCase()}</p>
                                    </div>
                                    <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-xl">
                                        An intelligence trigger has flagged this activity. Our systems intercepted the request to maintain account integrity.
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${alert.status === 'open' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                    } transition-all cursor-pointer hover:scale-105`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{alert.status === 'open' ? 'Take Action' : 'Resolved'}</span>
                                    <ExternalLink size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-all">
                            <ShieldCheck size={80} />
                        </div>
                    </motion.div>
                ))}

                {!alerts.length && (
                    <div className="p-20 flex flex-col items-center justify-center text-center space-y-6 hud-panel border-dashed bg-emerald-500/5 border-emerald-500/20">
                        <div className="p-6 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <ShieldCheck size={48} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] italic mb-2">Network Clean</h3>
                            <p className="text-slate-500 text-sm max-w-sm">
                                Zero active threats detected on your account. Your digital perimeter is secure.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
