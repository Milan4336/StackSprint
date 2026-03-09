import { motion } from 'framer-motion';
import { Smartphone, Monitor, Tablet, ShieldCheck, AlertTriangle, Plus, MoreVertical, Globe } from 'lucide-react';
import { format } from 'date-fns';

export const PortalDevices = ({ devices }: { devices: any[] }) => {
    const getDeviceIcon = (userAgent: string) => {
        if (userAgent.toLowerCase().includes('mobile') || userAgent.toLowerCase().includes('iphone')) return Smartphone;
        if (userAgent.toLowerCase().includes('tablet') || userAgent.toLowerCase().includes('ipad')) return Tablet;
        return Monitor;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-lg italic">Asset Management</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Verified Hardware & Access Nodes</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all">
                    <Plus size={14} /> Link New Device
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((device, idx) => {
                    const Icon = getDeviceIcon(device.userAgent || '');
                    const isTrusted = device.deviceTrustScore >= 70;

                    return (
                        <motion.div
                            key={device._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 rounded-2xl border border-white/5 bg-white/5 relative group overflow-hidden"
                        >
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-black/40 border ${isTrusted ? 'border-emerald-500/20 text-emerald-500' : 'border-amber-500/20 text-amber-400'}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black uppercase tracking-widest text-sm">{device.deviceLabel || 'Unknown Node'}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                            {device.platform || 'General Purpose OS'}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-600 hover:text-white transition-colors">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Node Integrity</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full ${isTrusted ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isTrusted ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {isTrusted ? 'VERIFIED' : 'ANALYZING'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Last Seen</p>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                        {format(new Date(device.lastSeen), 'MMM dd, HH:mm')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] relative z-10 px-1">
                                <Globe size={10} /> {device.lastKnownIp || 'Unknown IP'}
                            </div>

                            <div className={`absolute top-0 right-0 w-32 h-32 ${isTrusted ? 'bg-emerald-500/5' : 'bg-amber-500/5'} blur-[40px] rounded-full -mr-10 -mt-10`} />
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};
