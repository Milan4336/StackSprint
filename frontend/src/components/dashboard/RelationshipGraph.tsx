import React, { useMemo } from 'react';
import { Transaction } from '../../types';

interface RelationshipGraphProps {
    transactions: Transaction[];
    focusUserId?: string;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ transactions, focusUserId }) => {
    // A simple force-directed graph approximation strictly using SVG and Math.sin/cos
    const nodes = useMemo(() => {
        const userNodes = new Set<string>();
        const deviceNodes = new Set<string>();
        const edges: { source: string, target: string, isFraud: boolean }[] = [];

        // Take top 15 txs to avoid clutter
        const txs = transactions.slice(0, 15);

        txs.forEach((tx: Transaction) => {
            if (tx.userId) userNodes.add(tx.userId);
            if (tx.deviceId) deviceNodes.add(tx.deviceId);
            if (tx.userId && tx.deviceId) {
                edges.push({ source: tx.userId, target: tx.deviceId, isFraud: tx.isFraud });
            }
        });

        const uArray = Array.from(userNodes);
        const dArray = Array.from(deviceNodes);

        // Position users in outer circle, devices in inner circle
        const mappedNodes: Record<string, { id: string, type: 'user' | 'device', x: number, y: number, active: boolean }> = {};

        uArray.forEach((id, i) => {
            const angle = (i / uArray.length) * Math.PI * 2;
            mappedNodes[id] = {
                id, type: 'user',
                x: 100 + 80 * Math.cos(angle),
                y: 100 + 80 * Math.sin(angle),
                active: id === focusUserId
            };
        });

        dArray.forEach((id, i) => {
            const angle = (i / dArray.length) * Math.PI * 2;
            mappedNodes[id] = {
                id, type: 'device',
                x: 100 + 40 * Math.cos(angle),
                y: 100 + 40 * Math.sin(angle),
                active: false
            };
        });

        return { nodes: Object.values(mappedNodes), edges, mappedNodes };
    }, [transactions, focusUserId]);

    return (
        <div className="w-full h-full p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Identity Graph</h3>
            <div className="flex-1 relative min-h-[250px]">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Edges */}
                    {nodes.edges.map((edge: any, i: number) => {
                        const s = nodes.mappedNodes[edge.source];
                        const t = nodes.mappedNodes[edge.target];
                        if (!s || !t) return null;
                        return (
                            <line
                                key={i}
                                x1={s.x} y1={s.y}
                                x2={t.x} y2={t.y}
                                stroke={edge.isFraud ? "#ef4444" : "#334155"}
                                strokeWidth={edge.isFraud ? 1.5 : 0.5}
                                opacity={0.6}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.nodes.map((node: any) => (
                        <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                            <circle
                                r={node.type === 'user' ? 4 : 3}
                                fill={node.active ? "#3b82f6" : node.type === 'user' ? "#94a3b8" : "#475569"}
                                stroke={node.active ? "#bfdbfe" : "none"}
                                strokeWidth={1}
                            />
                            {node.active && (
                                <text y="-8" fontSize="6" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">
                                    {node.id.substring(0, 6)}
                                </text>
                            )}
                        </g>
                    ))}
                </svg>
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-slate-500 justify-center">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> User</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600"></span> Device</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500"></span> Fraud Link</span>
            </div>
        </div>
    );
};
