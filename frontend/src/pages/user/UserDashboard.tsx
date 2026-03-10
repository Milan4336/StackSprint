import { motion } from 'framer-motion';
import { LayoutGrid, CreditCard, Shield, Settings, Bell, ChevronRight, Activity, MapPin, Smartphone } from 'lucide-react';
import { RiskProfileView } from '../../components/user/RiskProfileView';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../../api/client';
import { Transaction } from '../../types';

export const UserDashboard = () => {
    const { data: transactions = [] } = useQuery<Transaction[]>({
        queryKey: ['user-transactions'],
        queryFn: () => monitoringApi.getTransactions(10),
    });

    const mockFactors = [
        { id: '1', factor: 'Device Trust', impact: 'positive' as const, description: 'You are using your primary MacBook Pro. Hardware ID is verified.' },
        { id: '2', factor: 'Geo Pattern', impact: 'positive' as const, description: 'Recent activity matches your home region in California.' },
        { id: '3', factor: 'Large Transfer', impact: 'negative' as const, description: 'Attempted $5,000 transfer to a new beneficiary flagged for review.' },
        { id: '4', factor: 'Login Velocity', impact: 'neutral' as const, description: 'Multiple successful logins from recognized IPs.' }
    ];

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <header className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Security Portal</h1>
                    <p className="text-slate-500 font-bold tracking-[0.2em] uppercase text-xs mt-2">Personal Fraud Guard V.2</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full" />
                    </button>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1px]">
                        <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-black">
                            JD
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Risk Profile */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <Shield size={16} className="text-blue-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Identity Security</h3>
                        </div>
                        <RiskProfileView score={14} factors={mockFactors} />
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-blue-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Live Activity Stream</h3>
                            </div>
                            <button className="text-[10px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-widest transition">
                                View Statement
                            </button>
                        </div>

                        <div className="space-y-3">
                            {transactions.slice(0, 5).map((tx, idx) => (
                                <motion.div
                                    key={tx.transactionId}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${tx.isFraud ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                                            <CreditCard size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">{tx.location || 'Global Transfer'}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{tx.city || tx.location} • {new Date(tx.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-white">${tx.amount.toLocaleString()}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${tx.isFraud ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {tx.isFraud ? 'Flagged' : 'Cleared'}
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 transition" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right: Insights & Quick Actions */}
                <div className="space-y-8">
                    <section className="p-6 rounded-[32px] border border-slate-800 bg-slate-900/40">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 italic">Secure Devices</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Smartphone size={18} className="text-blue-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-100">iPhone 15 Pro</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Primary • San Francisco</p>
                                    </div>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                            <div className="flex items-center justify-between opacity-50">
                                <div className="flex items-center gap-3">
                                    <Smartphone size={18} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-100">Windows PC</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Last seen 12h ago</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Offline</p>
                            </div>
                        </div>
                        <button className="w-full mt-8 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300 transition">
                            Add Trusted Device
                        </button>
                    </section>

                    <section className="p-6 rounded-[32px] border border-blue-500/10 bg-blue-600/5">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={16} className="text-blue-400" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Security Insights</h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            We noticed a high volume of transactions from <span className="text-blue-400 font-bold underline">Western Europe</span>. If you are not traveling, consider enabling traveler mode.
                        </p>
                        <button className="mt-4 flex items-center gap-1 text-[10px] font-black text-blue-400 hover:underline uppercase">
                            Enable Traveler Mode <ChevronRight size={12} />
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};
