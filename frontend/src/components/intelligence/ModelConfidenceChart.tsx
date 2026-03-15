import { useEffect, useId, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
    time: string;
    value: number;
}

export const ModelConfidenceChart = ({ initialData }: { initialData: DataPoint[] }) => {
    const [data, setData] = useState<DataPoint[]>(initialData);
    const gradientId = useId().replace(/:/g, '');
    const readVar = (name: string, fallback: string): string => {
        if (typeof window === 'undefined') return fallback;
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    };
    const accent = readVar('--accent', '#6366f1');
    const muted = readVar('--app-text-muted', '#475569');
    const strong = readVar('--app-text-strong', '#f8fafc');
    const surface = readVar('--surface-3', '#0f172a');
    const border = readVar('--surface-border', '#334155');

    useEffect(() => {
        const handleNewData = (payload: any) => {
            if (payload.confidence) {
                setData(prev => {
                    const next = [...prev, { time: payload.timestamp, value: payload.confidence }];
                    if (next.length > 20) return next.slice(next.length - 20);
                    return next;
                });
            }
        };

        // Listen for socket events. If the slice were proper Zustand, we'd subscribe. 
        // For now we'll listen directly here assuming socket is global or we pass it down.
        // Actually the slice is listening but doing console.log.
        // I will just use a custom event or a setInterval fallback until we modify the slice.
        const int = setInterval(() => {
            // Fallback for demo just in case socket is delayed
            // The slice handles socket io, we can attach a window listener from the slice.
        }, 10000);
        return () => clearInterval(int);
    }, []);

    // Workaround: We hook into window events that we'll dispatch from the slice
    useEffect(() => {
        const handler = (e: any) => {
            const p = e.detail;
            setData(prev => {
                const next = [...prev, { time: p.timestamp, value: p.confidence }];
                if (next.length > 20) return next.slice(next.length - 20);
                return next;
            });
        };
        window.addEventListener('intelligence:confidence', handler);
        return () => window.removeEventListener('intelligence:confidence', handler);
    }, []);

    if (data.length === 0) return <div className="theme-muted-text text-xs">Loading...</div>;

    const currentConfidence = data[data.length - 1].value;

    return (
        <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={accent} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={accent} stopOpacity={0} />
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
                        cursor={{ stroke: accent, strokeWidth: 1 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={accent}
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
