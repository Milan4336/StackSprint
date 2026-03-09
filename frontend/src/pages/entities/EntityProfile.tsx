import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    CreditCard,
    Globe,
    Smartphone,
    Clock,
    Shield,
    User as UserIcon,
    TrendingUp,
    History
} from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { formatSafeDate } from '../../utils/date';
import { formatCurrency } from '../../utils/number';

export const EntityProfile = () => {
    const { id } = useParams<{ id: string }>();

    const entityQuery = useQuery({
        queryKey: ['entity', id],
        queryFn: () => monitoringApi.getEntity(id!),
        enabled: !!id
    });

    const timelineQuery = useQuery({
        queryKey: ['timeline', id],
        queryFn: () => monitoringApi.getTimeline(id!),
        enabled: !!id
    });

    if (entityQuery.isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="loading-spinner h-12 w-12" />
            </div>
        );
    }

    const data = entityQuery.data;

    return (
        <div className="space-y-6">
            {/* Header Panel */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel border-l-4 border-l-blue-500"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${data?.type === 'user' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {data?.type === 'user' ? <UserIcon size={32} /> : <Globe size={32} />}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                {data?.type} Intelligence
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">{id}</h1>
                            <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                                <span className="flex items-center gap-1"><Shield size={14} /> Risk Score: {data?.riskScore}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="flex items-center gap-1"><Activity size={14} /> Status: {data?.user?.status || 'Active'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className={`text-4xl font-black ${data?.riskScore > 75 ? 'text-red-500' : data?.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {data?.riskScore}
                        </div>
                        <p className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold">Threat Index</p>
                    </div>
                </div>
            </motion.section>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Behavior Baselines */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="panel lg:col-span-1"
                >
                    <h3 className="panel-title flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-400" /> Behavior Profile
                    </h3>
                    <div className="space-y-4 mt-6">
                        <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Avg Transaction</p>
                            <p className="text-2xl font-bold mt-1 text-slate-100">$428.50</p>
                            <div className="mt-2 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[65%]" />
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Velocity (Last 24h)</p>
                            <p className="text-2xl font-bold mt-1 text-slate-100">{data?.transactions?.length || 0} TXs</p>
                            <div className="mt-2 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[40%]" />
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Device Trust</p>
                            <p className="text-2xl font-bold mt-1 text-slate-100">89%</p>
                            <div className="mt-2 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[89%]" />
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Forensic Timeline */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="panel lg:col-span-2"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="panel-title mb-0 flex items-center gap-2">
                            <History size={18} className="text-emerald-400" /> Forensic Timeline
                        </h3>
                        <button className="text-xs font-bold text-blue-400 uppercase hover:text-blue-300">Export Report</button>
                    </div>

                    <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                        {timelineQuery.data?.slice(0, 8).map((event: any, i: number) => (
                            <div key={event.id} className="relative pl-10">
                                <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${event.riskScore > 75 ? 'bg-red-500' : event.riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}>
                                    <Activity size={10} className="text-white" />
                                </div>
                                <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30 hover:bg-slate-800/50 transition duration-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-100">{event.type}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{formatSafeDate(event.at)}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="text-xs text-slate-400">
                                            {event.metadata?.merchant || 'System Event'} • {event.metadata?.location || 'Unknown Origin'}
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-200">{formatCurrency(event.amount)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!timelineQuery.data || timelineQuery.data.length === 0) && (
                            <div className="text-center py-12 text-slate-500">
                                No chronological events recorded for this entity.
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Linked Assets */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="panel"
                >
                    <h3 className="panel-title flex items-center gap-2">
                        <Smartphone size={18} className="text-indigo-400" /> Linked Devices
                    </h3>
                    <div className="mt-4 space-y-2">
                        {data?.device ? (
                            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="text-slate-400" size={16} />
                                    <div>
                                        <p className="text-sm font-bold text-slate-100">{data.device.browser} on {data.device.os}</p>
                                        <p className="text-[10px] text-slate-500">ID: {data.device.deviceId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="chip py-0.5 px-2 bg-emerald-500/10 text-emerald-400 border-none">Trusted</div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No specific device fingerprint associated.</p>
                        )}
                    </div>
                </motion.section>

                {/* Active Alerts */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="panel"
                >
                    <h3 className="panel-title flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-400" /> Active Security Alerts
                    </h3>
                    <div className="mt-4 space-y-2">
                        {data?.alerts?.map((alert: any) => (
                            <div key={alert.alertId} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="text-red-400" size={16} />
                                    <div>
                                        <p className="text-sm font-bold text-slate-100">{alert.ruleId || 'Suspicious Pattern'}</p>
                                        <p className="text-[10px] text-slate-500">{formatSafeDate(alert.createdAt)}</p>
                                    </div>
                                </div>
                                <div className={`chip py-0.5 px-2 border-none ${alert.status === 'open' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {alert.status}
                                </div>
                            </div>
                        ))}
                        {(!data?.alerts || data.alerts.length === 0) && (
                            <p className="text-sm text-slate-500 italic">No active security alerts for this entity.</p>
                        )}
                    </div>
                </motion.section>
            </div>
        </div>
    );
};
