import { motion } from 'framer-motion';
import { CreditCard, AlertTriangle, ShieldCheck, Search, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

export const PortalTransactions = ({ transactions }: { transactions: any[] }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg italic">Transaction Archive</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Comprehensive Ledger History</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition-all text-slate-400">
                        <Search size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition-all text-slate-400">
                        <Filter size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition-all text-slate-400">
                        <Download size={16} />
                    </button>
                </div>
            </div>

            <div className="grid gap-3">
                {transactions.map((tx, idx) => (
                    <motion.div
                        key={tx.transactionId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-2xl bg-black/40 border border-white/10 ${tx.isFraud ? 'text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'text-slate-400'}`}>
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h4 className="text-base font-black text-white uppercase tracking-tight">{tx.location}</h4>
                                    {tx.isFraud && (
                                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-red-500/30">
                                            <AlertTriangle size={8} /> Suspicious
                                        </span>
                                    )}
                                    {tx.verificationStatus === 'VERIFIED' && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-500/30">
                                            <ShieldCheck size={8} /> Verified
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    <span>{format(new Date(tx.timestamp), 'MMM dd, yyyy • HH:mm:ss')}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span>ID: {tx.transactionId.slice(-8)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-white tracking-widest">{tx.amount.toFixed(2)} {tx.currency}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${tx.isFraud ? 'text-red-500' : 'text-emerald-500'}`}>
                                {tx.isFraud ? 'Protocol Blocked' : 'Intelligence Cleared'}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
