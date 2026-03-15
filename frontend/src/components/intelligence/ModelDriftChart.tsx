import { useEffect, useId, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
    time: string;
    value: number;
}

export const ModelDriftChart = ({ initialData }: { initialData: DataPoint[] }) => {
    const [data, setData] = useState<DataPoint[]>(initialData);
    const gradientId = useId().replace(/:/g, '');
    const readVar = (name: string, fallback: string): string => {
        if (typeof window === 'undefined') return fallback;
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    };
    const warning = readVar('--status-warning', '#f97316');
    const muted = readVar('--app-text-muted', '#475569');
    const strong = readVar('--app-text-strong', '#f8fafc');
    const surface = readVar('--surface-3', '#0f172a');
    const border = readVar('--surface-border', '#334155');

    useEffect(() => {
        const handler = (e: any) => {
            const p = e.detail;
            setData(prev => {
                const next = [...prev, { time: p.timestamp, value: p.klDivergence }];
                if (next.length > 20) return next.slice(next.length - 20);
                return next;
            });
        };
        window.addEventListener('intelligence:drift', handler);
        return () => window.removeEventListener('intelligence:drift', handler);
    }, []);

    if (data.length === 0) return <div className="theme-muted-text text-xs">Loading...</div>;

    return (
        <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={warning} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={warning} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        tickFormatter={(t) => format(new Date(t), 'HH:mm')}
                        stroke={muted}
                        fontSize={10}
                        tickMargin={8}
                        minTickGap={20}
                    />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: `color-mix(in srgb, ${surface} 88%, black 12%)`,
                            border: `1px solid ${border}`,
                            borderRadius: '8px'
                        }}
                        itemStyle={{ color: strong }}
                        labelStyle={{ color: muted }}
                        labelFormatter={(t) => format(new Date(t), 'HH:mm:ss')}
                        cursor={{ stroke: warning, strokeWidth: 1 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={warning}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
