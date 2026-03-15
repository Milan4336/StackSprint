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
        ? 'var(--status-danger)'
        : threatLevel === 'HIGH'
            ? 'var(--status-warning)'
            : threatLevel === 'SUSPICIOUS'
                ? 'var(--accent-strong)'
                : 'var(--status-success)';

    return (
        <div
            className="z-20 flex h-8 shrink-0 items-center justify-between border-t px-4 text-[10px] font-black uppercase tracking-widest backdrop-blur-md"
            style={{
                background: 'color-mix(in srgb, var(--surface-3) 88%, transparent)',
                borderColor: 'var(--surface-border)',
                color: 'var(--app-text-muted)'
            }}
        >
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <PulseDot status={isHealthy ? 'up' : 'degraded'} />
                    <span>System {isHealthy ? 'Operational' : 'Degraded'}</span>
                </div>

                <div className="hidden items-center gap-4 border-l pl-4 md:flex" style={{ borderColor: 'var(--surface-border)' }}>
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
                    Risk: <span className="font-black" style={{ color: threatColor }}>{threatLevel}</span>
                </span>
                <span className="border-l pl-4" style={{ borderColor: 'var(--surface-border)' }}>
                    <Activity size={8} className="inline mr-1" />
                    {formatSafeDate(new Date().toISOString())}
                </span>
            </div>
        </div>
    );
};
