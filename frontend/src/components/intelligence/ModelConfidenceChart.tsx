import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useIntelligenceSlice } from '../../store/slices/intelligenceSlice';
import { format } from 'date-fns';

interface DataPoint {
    time: string;
    value: number;
}

export const ModelConfidenceChart = ({ initialData }: { initialData: DataPoint[] }) => {
    const [data, setData] = useState<DataPoint[]>(initialData);

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

    if (data.length === 0) return <div className="text-xs text-slate-500">Loading...</div>;

    const currentConfidence = data[data.length - 1].value;

    return (
        <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        tickFormatter={(t) => format(new Date(t), 'HH:mm')}
                        stroke="#475569"
                        fontSize={10}
                        tickMargin={8}
                        minTickGap={20}
                    />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px' }}
                        labelFormatter={(t) => format(new Date(t), 'HH:mm:ss')}
                        cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorConf)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
