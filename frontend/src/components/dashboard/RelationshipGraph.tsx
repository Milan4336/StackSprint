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
        <div className="theme-surface-card flex h-full w-full flex-col p-4">
            <h3 className="theme-stat-label mb-4">Identity Graph</h3>
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
                                stroke={edge.isFraud ? 'var(--status-danger)' : 'color-mix(in srgb, var(--surface-border) 82%, transparent)'}
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
                                fill={node.active
                                    ? 'var(--accent)'
                                    : node.type === 'user'
                                        ? 'var(--app-text-muted)'
                                        : 'color-mix(in srgb, var(--surface-border) 90%, var(--app-text-muted) 10%)'}
                                stroke={node.active ? 'color-mix(in srgb, var(--accent) 45%, white 55%)' : 'none'}
                                strokeWidth={1}
                            />
                            {node.active && (
                                <text y="-8" fontSize="6" fill="var(--app-text-muted)" textAnchor="middle" fontWeight="bold">
                                    {node.id.substring(0, 6)}
                                </text>
                            )}
                        </g>
                    ))}
                </svg>
            </div>
            <div className="theme-muted-text mt-2 flex justify-center gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--app-text-muted)' }} /> User</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'color-mix(in srgb, var(--surface-border) 90%, var(--app-text-muted) 10%)' }} /> Device</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-3" style={{ background: 'var(--status-danger)' }} /> Fraud Link</span>
            </div>
        </div>
    );
};
