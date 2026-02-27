import React from 'react';
import { motion } from 'framer-motion';
import { User, Activity, MapPin, Smartphone, TrendingUp, AlertTriangle } from 'lucide-react';

export const BehaviorProfiles = () => {
    // Synthetic profiles for demo
    const profiles = [
        {
            user: 'Milan_Stack',
            status: 'ACTIVE',
            avgAmount: '$124.50',
            frequency: '2.4 / day',
            deviation: 0.12,
            risk: 'Low',
            lastLoc: 'London, UK'
        },
        {
            user: 'Suspect_Alpha',
            status: 'RESTRICTED',
            avgAmount: '$2,840.10',
            frequency: '14.2 / day',
            deviation: 0.85,
            risk: 'High',
            lastLoc: 'Lagos, NG'
        },
        {
            user: 'User_X_77',
            status: 'ACTIVE',
            avgAmount: '$45.00',
            frequency: '0.1 / day',
            deviation: 0.44,
            risk: 'Medium',
            lastLoc: 'New York, US'
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <header>
                <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
                    <TrendingUp className="text-emerald-500" strokeWidth={3} /> Behavioral Profiling
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Monitoring individual user baseline patterns and detecting anomalous deviations.
                </p>
            </header>

            <div className="grid gap-6">
                {profiles.map((profile, idx) => (
                    <motion.div
                        key={profile.user}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="panel hover:border-blue-500/50 transition-colors group"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl grid place-items-center ${profile.risk === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{profile.user}</h3>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${profile.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                        {profile.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-12">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Transaction</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">{profile.avgAmount}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Frequency</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">{profile.frequency}</p>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Risk</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${profile.deviation * 100}%` }}
                                                className={`h-full ${profile.risk === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
                                            />
                                        </div>
                                        <span className={`text-xs font-bold ${profile.risk === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>{profile.risk}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right hidden md:block">
                                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <MapPin size={12} /> {profile.lastLoc}
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400 font-medium">
                                        <Activity size={10} /> Active now
                                    </div>
                                </div>
                                <button className="glass-btn border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
                                    Analyze Baseline
                                </button>
                            </div>
                        </div>

                        {profile.deviation > 0.5 && (
                            <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                                <AlertTriangle className="text-red-500 shrink-0" size={16} />
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                    Critical deviation detected: Transaction frequency increased by 500% compared to last 30 days. High probability of automated script or takeover.
                                </p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <footer className="panel border-dashed p-8 text-center italic text-slate-500 font-medium text-sm">
                Statistical baselines are updated continuously via the Behavior Profiling Service.
            </footer>
        </div>
    );
};
