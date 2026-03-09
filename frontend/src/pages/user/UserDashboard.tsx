import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    CreditCard,
    Smartphone,
    History,
    Bell,
    ChevronRight,
    AlertTriangle,
    Zap,
    Activity,
    ArrowUpRight,
    ShieldAlert,
    Fingerprint
} from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { useUISound } from '../../hooks/useUISound';
import { HUDCard } from '../../components/layout/HUDCard';
import { HUDCorner, HUDScanline } from '../../components/visual/HUDDecorations';
import { format } from 'date-fns';
import { useThemeStore } from '../../store/themeStore';
import { PortalTransactions } from '../../components/portal/PortalTransactions';
import { PortalDevices } from '../../components/portal/PortalDevices';
import { PortalLogins } from '../../components/portal/PortalLogins';
import { PortalAlerts } from '../../components/portal/PortalAlerts';
import { useQuery } from '@tanstack/react-query';

export const UserDashboard = () => {
    const { playSound } = useUISound();
    const { theme } = useThemeStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const themeConfig = ({
        cyber: { primary: 'blue', text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
        neon: { primary: 'purple', text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
        tactical: { primary: 'emerald', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' }
    } as Record<string, any>)[theme] || { primary: 'blue', text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' };

    useEffect(() => {
        const fetchPortalData = async () => {
            try {
                const [dashboard, txs, devices, logins, alerts] = await Promise.all([
                    monitoringApi.getPortalDashboard(),
                    monitoringApi.getPortalTransactions(),
                    monitoringApi.getPortalDevices(),
                    monitoringApi.getPortalLogins(),
                    monitoringApi.getPortalAlerts()
                ]);
                setData({
                    ...dashboard,
                    transactions: txs,
                    activeDevices: devices,
                    logins: logins,
                    alerts: alerts
                });
            } catch (error) {
                console.error('Failed to load portal data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPortalData();
    }, []);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className={`h-12 w-12 rounded-full border-t-2 border-r-2 ${themeConfig.border} border-t-${themeConfig.primary}-500`}
                />
                <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${themeConfig.text} animate-pulse`}>Syncing with Node...</p>
            </div>
        </div>
    );

    const safetyScore = data?.user?.identitySafetyScore || 0;
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen bg-[#050510] text-slate-300 p-8 pt-24 font-['Inter']">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 relative z-10">

                {/* Left Sidebar: Nav */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="hud-panel p-6 relative overflow-hidden">
                        <HUDCorner position="top-left" />
                        <HUDScanline />
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`p-3 rounded-xl ${themeConfig.bg} border ${themeConfig.border}`}>
                                <ShieldCheck className={themeConfig.text} size={20} />
                            </div>
                            <div>
                                <h2 className="text-white font-black uppercase tracking-widest text-sm">{data?.user?.fullName}</h2>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Standard User</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {[
                                { id: 'overview', icon: Activity, label: 'Command Hub' },
                                { id: 'transactions', icon: CreditCard, label: 'Transactions' },
                                { id: 'devices', icon: Smartphone, label: 'Linked Devices' },
                                { id: 'logins', icon: History, label: 'Node Access' },
                                { id: 'alerts', icon: Bell, label: 'Security Net' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id); playSound('SCAN'); }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${activeTab === item.id ? themeConfig.bg + ' ' + themeConfig.text : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={16} className={activeTab === item.id ? themeConfig.text : 'text-slate-500'} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    {activeTab === item.id && <Zap size={10} className="animate-pulse" />}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <HUDCard className="p-6 border-emerald-500/20 bg-emerald-500/5">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <ShieldCheck size={14} /> Zero Trust Active
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            "Your identity is being verified by 12 distinct neural nodes in real-time."
                        </p>
                    </HUDCard>
                </div>

                {/* Main Workspace */}
                <div className="col-span-12 lg:col-span-9 space-y-8">

                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-12 gap-8"
                            >
                                {/* Identity Safety Gauge */}
                                <div className="col-span-12 lg:col-span-7 hud-panel p-8 relative">
                                    <HUDCorner position="top-right" />
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-widest text-lg">Identity Safety</h3>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Real-time Intelligence Aggregate</p>
                                        </div>
                                        <div className={`p-2 rounded-lg bg-black/40 border ${themeConfig.border}`}>
                                            <Fingerprint className={themeConfig.text} size={20} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12 py-4">
                                        <div className="relative h-40 w-40 flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                <circle
                                                    cx="80" cy="80" r="70"
                                                    fill="transparent"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    className="text-white/5"
                                                />
                                                <motion.circle
                                                    cx="80" cy="80" r="70"
                                                    fill="transparent"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    strokeDasharray="440"
                                                    initial={{ strokeDashoffset: 440 }}
                                                    animate={{ strokeDashoffset: 440 - (440 * safetyScore) / 100 }}
                                                    transition={{ duration: 2, ease: "easeOut" }}
                                                    className={getScoreColor(safetyScore)}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="text-center group">
                                                <motion.span
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className={`text-5xl font-black ${getScoreColor(safetyScore)} tracking-tighter`}
                                                >
                                                    {safetyScore}
                                                </motion.span>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Grade</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            {[
                                                { label: 'Device Integrity', val: 'VULNERABLE', color: 'text-amber-400' },
                                                { label: 'Behavioral Path', val: 'CONSISTENT', color: 'text-emerald-400' },
                                                { label: 'Login Clusters', val: 'LOCALIZED', color: 'text-emerald-400' }
                                            ].map(stat => (
                                                <div key={stat.label} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Info Cards */}
                                <div className="col-span-12 lg:col-span-5 grid grid-rows-2 gap-4">
                                    <div className="hud-panel p-6 border-red-500/20 bg-red-500/5 group">
                                        <div className="flex items-center justify-between mb-2">
                                            <ShieldAlert size={20} className="text-red-500" />
                                            <ChevronRight size={14} className="text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Active Alerts</h4>
                                        <p className="text-2xl font-black text-white">{data?.alerts?.length || 0}</p>
                                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">Immediate action required</p>
                                    </div>
                                    <div className="hud-panel p-6 border-blue-500/20 bg-blue-500/5 group">
                                        <div className="flex items-center justify-between mb-2">
                                            <ArrowUpRight size={20} className="text-blue-500" />
                                            <ChevronRight size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Linked Assets</h4>
                                        <p className="text-2xl font-black text-white">{data?.activeDevices?.length || 1}</p>
                                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">Verified devices & nodes</p>
                                    </div>
                                </div>

                                {/* Recent Transactions List */}
                                <div className="col-span-12 hud-panel p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-white font-black uppercase tracking-widest text-lg italic">Recent Ledger Activity</h3>
                                        <button onClick={() => setActiveTab('transactions')} className={`text-[10px] font-black uppercase tracking-widest ${themeConfig.text} hover:opacity-70 flex items-center gap-2`}>
                                            View Archive <ChevronRight size={12} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {data?.recentTransactions?.map((tx: any) => (
                                            <motion.div
                                                key={tx.transactionId}
                                                whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between group transition-all"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`p-3 rounded-xl bg-black/40 border border-white/10 ${tx.isFraud ? 'text-red-500 border-red-500/30' : 'text-slate-400'}`}>
                                                        {tx.isFraud ? <AlertTriangle size={18} /> : <CreditCard size={18} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{tx.location}</h4>
                                                            {tx.isFraud && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest">Suspicious</span>}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{format(new Date(tx.timestamp), 'MMM dd, HH:mm')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-white tracking-widest">{tx.amount} {tx.currency}</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${tx.isFraud ? 'text-red-500' : 'text-emerald-500'}`}>{tx.isFraud ? 'Flagged' : 'Cleared'}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {!data?.recentTransactions?.length && (
                                            <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                                <Activity className="mx-auto text-slate-700 mb-4" size={32} />
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                                                    No ledger activity detected in the current epoch.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'transactions' && (
                            <PortalTransactions transactions={data?.transactions || []} />
                        )}

                        {activeTab === 'devices' && (
                            <PortalDevices devices={data?.activeDevices || []} />
                        )}

                        {activeTab === 'logins' && (
                            <PortalLogins logs={data?.logins || []} />
                        )}

                        {activeTab === 'alerts' && (
                            <PortalAlerts alerts={data?.alerts || []} />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
