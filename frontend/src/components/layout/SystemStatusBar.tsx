import { useQuery } from '@tanstack/react-query';
import { Database, Activity, Server, Cpu, ShieldAlert, BellRing } from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { useThreatStore } from '../../store/threatStore';
import { formatSafeDate } from '../../utils/date';

const PulseDot = ({ status }: { status: 'up' | 'degraded' | 'down' }) => {
    const color = status === 'up' ? 'bg-emerald-400' : status === 'degraded' ? 'bg-amber-400' : 'bg-red-400';
    const speed = status === 'up' ? 'animate-pulse [animation-duration:2s]' : 'animate-pulse [animation-duration:0.8s]';
    return (
        <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${color} ${speed}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
        </span>
    );
};

export const SystemStatusBar = () => {
    const threatLevel = useThreatStore((state) => state.threatLevel);
    const mlStatus = useThreatStore((state) => state.mlStatus);

    const systemQuery = useQuery({
        queryKey: ['system', 'health', 'statusbar'],
        queryFn: () => monitoringApi.getSystemHealth(),
        refetchInterval: 10000
    });

    const mongoOk = systemQuery.data?.mongoStatus === 'UP';
    const redisOk = systemQuery.data?.redisStatus === 'UP';
    const mlOk = systemQuery.data?.mlStatus === 'UP' || mlStatus === 'HEALTHY';
    const isHealthy = Boolean(mongoOk && redisOk && mlOk);

    const threatColor = threatLevel === 'CRITICAL'
        ? 'text-red-400'
        : threatLevel === 'HIGH'
            ? 'text-orange-400'
            : threatLevel === 'SUSPICIOUS'
                ? 'text-amber-400'
                : 'text-emerald-400';

    return (
        <div className="h-8 shrink-0 bg-[#0b1629]/95 backdrop-blur-md border-t border-slate-800/50 flex items-center justify-between px-4 z-20 text-[10px] uppercase tracking-widest font-black text-slate-500">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <PulseDot status={isHealthy ? 'up' : 'degraded'} />
                    <span>System {isHealthy ? 'Operational' : 'Degraded'}</span>
                </div>

                <div className="hidden md:flex items-center gap-4 border-l border-slate-800 pl-4">
                    <div className="flex items-center gap-1.5">
                        <PulseDot status={mongoOk ? 'up' : 'down'} />
                        <Database size={10} />
                        <span>MongoDB</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <PulseDot status={redisOk ? 'up' : 'down'} />
                        <Server size={10} />
                        <span>Redis Bus</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <PulseDot status={mlOk ? 'up' : mlStatus === 'DEGRADED' ? 'degraded' : 'down'} />
                        <Cpu size={10} />
                        <span>ML Pipeline</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <PulseDot status={isHealthy ? 'up' : 'down'} />
                        <ShieldAlert size={10} />
                        <span>Isolation Engine</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <PulseDot status={isHealthy ? 'up' : 'down'} />
                        <BellRing size={10} />
                        <span>Alerts</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="hidden sm:inline">
                    Risk: <span className={`font-black ${threatColor}`}>{threatLevel}</span>
                </span>
                <span className="border-l border-slate-800 pl-4">
                    <Activity size={8} className="inline mr-1" />
                    {formatSafeDate(new Date().toISOString())}
                </span>
            </div>
        </div>
    );
};
