import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, Zap } from 'lucide-react';
import { useThreatStore } from '../../store/threatStore';

export const DefenseShield = () => {
    const threatIndex = useThreatStore(state => state.threatIndex);
    const isActive = threatIndex > 95;

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
                >
                    {/* Hexagonal Overlays */}
                    <div className="absolute inset-0 bg-red-950/20 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 opacity-[0.05]" style={{
                        backgroundImage: 'radial-gradient(#ef4444 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }} />

                    {/* Shield UI */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-12 rounded-[40px] border-4 border-red-500/50 bg-slate-900/90 shadow-[0_0_100px_rgba(239,68,68,0.3)] flex flex-col items-center gap-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse" />

                        <div className="relative">
                            <ShieldAlert className="text-red-500 w-24 h-24" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-x-[-20px] inset-y-[-20px] rounded-full border-2 border-dashed border-red-500/30"
                            />
                        </div>

                        <div className="text-center">
                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-2">Total Lockdown</h2>
                            <p className="text-red-400 font-bold tracking-[0.3em] uppercase">Active Defense Protocol V9</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-full border border-red-500/30 text-xs font-black text-red-100 uppercase">
                                <Lock size={14} /> Transactions Frozen
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-full border border-red-500/30 text-xs font-black text-red-100 uppercase">
                                <Zap size={14} /> AI Intervention
                            </div>
                        </div>

                        {/* Moving Scanline */}
                        <motion.div
                            animate={{ y: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-x-0 h-1 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,1)]"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
