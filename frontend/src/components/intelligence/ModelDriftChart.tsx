import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
    time: string;
    value: number;
}

export const ModelDriftChart = ({ initialData }: { initialData: DataPoint[] }) => {
    const [data, setData] = useState<DataPoint[]>(initialData);

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

    if (data.length === 0) return <div className="text-xs text-slate-500">Loading...</div>;

    return (
        <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                        cursor={{ stroke: '#f97316', strokeWidth: 1 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#f97316"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorDrift)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
