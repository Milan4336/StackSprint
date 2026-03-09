import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';
import { Transaction } from '../../types';

interface GeoHeatmapProps {
    transactions: Transaction[];
}

export const GeoHeatmap: React.FC<GeoHeatmapProps> = ({ transactions }) => {
    // Convert transactions to a scatter plot representation of "regions"
    // Since we don't have actual Lat/Lng, we use predefined grid positions for common countries
    const regionCoords: Record<string, { x: number, y: number }> = {
        'US': { x: 20, y: 70 },
        'UK': { x: 45, y: 80 },
        'CA': { x: 20, y: 85 },
        'AU': { x: 85, y: 20 },
        'DE': { x: 50, y: 75 },
        'FR': { x: 48, y: 72 },
        'JP': { x: 88, y: 65 },
        'CN': { x: 80, y: 60 },
        'IN': { x: 70, y: 55 },
        'BR': { x: 30, y: 30 },
        'RU': { x: 65, y: 85 },
        'Unknown': { x: 50, y: 50 }
    };

    const data = useMemo(() => {
        const map = new Map<string, { x: number, y: number, z: number, fraud: number, total: number }>();

        transactions.forEach(tx => {
            const loc = tx.country || tx.location || 'Unknown';
            const coords = regionCoords[loc] || regionCoords['Unknown'];

            const existing = map.get(loc) || { ...coords, z: 0, fraud: 0, total: 0 };
            existing.total += 1;
            existing.z += 10; // increase bubble size
            if (tx.isFraud) existing.fraud += 1;

            map.set(loc, existing);
        });

        return Array.from(map.entries()).map(([name, val]) => ({
            name,
            ...val,
            riskRatio: val.total > 0 ? val.fraud / val.total : 0
        }));
    }, [transactions]);

    return (
        <div className="w-full h-full p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Global Attack Heatmap</h3>
            <div className="h-[250px] w-full relative">
                {/* World Map SVG background outline */}
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M10,80 Q20,90 30,70 T50,50 T80,30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <XAxis type="number" dataKey="x" name="Longitude" hide domain={[0, 100]} />
                        <YAxis type="number" dataKey="y" name="Latitude" hide domain={[0, 100]} />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} name="Volume" />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                            itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value: any, name: string, props: any) => {
                                if (name === 'Volume') return [props.payload.total, 'Transactions'];
                                if (name === 'Latitude' || name === 'Longitude') return [];
                                return [value, name];
                            }}
                        />
                        <Scatter data={data} shape="circle">
                            {data.map((entry: any, index: number) => {
                                // Color based on risk ratio
                                const r = Math.min(255, Math.floor(entry.riskRatio * 255 * 2));
                                const g = Math.max(0, 150 - entry.riskRatio * 150);
                                const color = entry.riskRatio > 0.1 ? `rgb(${r}, ${g}, 50)` : '#3b82f6';

                                return <Cell key={`cell-${index}`} fill={color} opacity={0.7} />;
                            })}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
