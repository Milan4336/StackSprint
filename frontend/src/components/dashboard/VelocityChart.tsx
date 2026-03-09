import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VelocityData {
    time: string;
    tps: number;
}

export const VelocityChart = () => {
    const [data, setData] = useState<VelocityData[]>([]);

    useEffect(() => {
        // Fill with empty data initially
        const now = new Date();
        const initialData = Array.from({ length: 20 }, (_, i) => {
            const d = new Date(now.getTime() - (20 - i) * 1000);
            return {
                time: d.toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
                tps: 0
            };
        });
        setData(initialData);

        const handleVelocityLive = (e: Event) => {
            const customEvent = e as CustomEvent;
            const tps = customEvent.detail?.currentTps || 0;

            setData((prev: VelocityData[]) => {
                const newData = [...prev.slice(1)];
                newData.push({
                    time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
                    tps
                });
                return newData;
            });
        };

        window.addEventListener('velocity:live', handleVelocityLive);
        return () => window.removeEventListener('velocity:live', handleVelocityLive);
    }, []);

    return (
        <div className="w-full h-full min-h-[250px] p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Transaction Velocity (TPS)</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} />
                        <YAxis stroke="#475569" fontSize={10} tickFormatter={(value: number) => `${value}`} width={30} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                            itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                            cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="tps" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTps)" isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
