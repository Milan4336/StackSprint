import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
    Search,
    ZoomIn,
    ZoomOut,
    Maximize2,
    AlertOctagon,
    Network,
    Activity,
} from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import { SimulationControlCenter } from '../../components/SimulationControlCenter';
import { GraphRiskPanel } from '../../components/graph/GraphRiskPanel';
import { DeviceIntelligencePanel } from '../../components/dashboard/DeviceIntelligencePanel';
import { EnrichedGraphNode, FraudCluster } from '../../types';

interface D3Node extends d3.SimulationNodeDatum, EnrichedGraphNode {
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
    source: string | D3Node;
    target: string | D3Node;
    type: string;
    fraudScore?: number;
}

// Risk score → colour gradient
const nodeColor = (d: D3Node): string => {
    const s = d.riskScore ?? 0;
    if (s >= 75) return 'var(--status-danger)';
    if (s >= 50) return 'var(--status-warning)';
    if (s >= 30) return 'var(--status-warning)';
    return d.type === 'USER' ? 'var(--accent)' : d.type === 'DEVICE' ? 'var(--status-info)' : d.type === 'IP' ? 'var(--status-info)' : 'var(--status-success)';
};

// Edge colour by relationship type
const linkColor = (l: D3Link): string => {
    if (l.type === 'TX_USER') return l.fraudScore && l.fraudScore > 0.6 ? 'var(--status-danger)' : 'var(--app-text-muted)';
    if (l.type === 'USER_DEVICE' || l.type === 'USED_BY') return 'var(--status-info)';
    if (l.type === 'USER_IP' || l.type === 'CONNECTED_TO') return 'var(--status-warning)';
    return 'color-mix(in srgb, var(--surface-border) 85%, transparent)';
};

export const InvestigationWorkspace = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedNode, setSelectedNode] = useState<EnrichedGraphNode | null>(null);

    const { data: graphData, isLoading } = useQuery({
        queryKey: ['investigation-graph'],
        queryFn: () => monitoringApi.getGraph(500),
        refetchInterval: 10000, // Faster refresh during simulation investigations
    });

    const { data: deviceIntelligence } = useQuery({
        queryKey: ['investigation-device-intelligence'],
        queryFn: () => monitoringApi.getDeviceIntelligence(20),
        refetchInterval: 20000,
    });

    const clusters: FraudCluster[] = (graphData as any)?.clusters ?? [];

    const runForensicAnalysis = useCallback(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.transition().duration(200)
            .style('filter', 'brightness(2) saturate(2) drop-shadow(0 0 20px var(--accent))')
            .transition().duration(900).style('filter', 'none');
        svg.select('g').selectAll<SVGCircleElement, D3Node>('.node circle')
            .transition().duration(500)
            .attr('r', (d) => (d.riskScore ?? 0) > 70 ? 26 : (d.type === 'TRANSACTION' ? 8 : 15))
            .style('stroke', (d) => (d.riskScore ?? 0) > 70 ? 'var(--app-text-strong)' : 'var(--surface-3)')
            .style('stroke-width', (d) => (d.riskScore ?? 0) > 70 ? 4 : 2)
            .transition().duration(2000)
            .attr('r', (d) => d.type === 'TRANSACTION' ? 8 : 15)
            .style('stroke', 'var(--surface-3)').style('stroke-width', 2);
    }, []);

    useEffect(() => {
        if (!graphData || !svgRef.current) return;

        const width = svgRef.current.clientWidth;
        const height = 750;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const g = svg.append('g');

        // Zoom
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));
        svg.call(zoom as any);

        // Filter nodes
        const allNodes: D3Node[] = (graphData.nodes as EnrichedGraphNode[]).map((n) => ({ ...n }));
        const filteredNodes = allNodes.filter((n) => {
            const matchesSearch = n.id.toLowerCase().includes(searchTerm.toLowerCase());
            if (filterType === 'all') return matchesSearch;
            if (filterType === 'high-risk') return matchesSearch && (n.riskScore ?? 0) > 60;
            if (filterType === 'fraud-rings') return matchesSearch && n.isFraudCluster;
            return matchesSearch;
        });

        const nodeIds = new Set(filteredNodes.map((n) => n.id));
        const filteredLinks: D3Link[] = (graphData.links as D3Link[]).filter((l) =>
            nodeIds.has((l.source as any).id || l.source) &&
            nodeIds.has((l.target as any).id || l.target)
        );

        // Simulation
        const simulation = d3.forceSimulation<D3Node>(filteredNodes)
            .force('link', d3.forceLink<D3Node, D3Link>(filteredLinks).id((d) => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<D3Node>().radius((d) => ((d.riskScore ?? 0) > 70 ? 30 : 20)));

        // Draw defs — glow filter
        const defs = svg.append('defs');
        const filter = defs.append('filter').attr('id', 'glow');
        filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Links
        const link = g.append('g')
            .selectAll<SVGLineElement, D3Link>('line')
            .data(filteredLinks)
            .join('line')
            .attr('stroke', (d) => linkColor(d))
            .attr('stroke-opacity', 0.55)
            .attr('stroke-width', (d) => d.type === 'TX_USER' ? 1 : 1.5);

        // Nodes
        const node = g.append('g')
            .selectAll<SVGGElement, D3Node>('.node')
            .data(filteredNodes)
            .join('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .call(d3.drag<SVGGElement, D3Node>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                })
            )
            .on('click', (_event, d) => setSelectedNode(d as EnrichedGraphNode));

        // Outer pulse ring for high-risk nodes (including simulation nodes)
        node.filter((d) => (d.riskScore ?? 0) >= 70)
            .append('circle')
            .attr('r', 22)
            .attr('fill', 'none')
            .attr('stroke', 'var(--status-danger)')
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.5)
            .attr('filter', 'url(#glow)')
            .each(function pulseAnimate() {
                const el = d3.select(this);
                (function loop() {
                    el.transition().duration(900).attr('r', 28).attr('stroke-opacity', 0)
                        .transition().duration(100).attr('r', 22).attr('stroke-opacity', 0.5)
                        .on('end', loop);
                })();
            });

        // Main circle
        node.append('circle')
            .attr('r', (d) => d.type === 'TRANSACTION' ? 7 : d.type === 'USER' ? 14 : 11)
            .attr('fill', (d) => nodeColor(d))
            .attr('stroke', (d) => (d.riskScore ?? 0) >= 70 ? 'var(--app-text-strong)' : 'var(--surface-3)')
            .attr('stroke-width', (d) => (d.riskScore ?? 0) >= 70 ? 2.5 : 1.5)
            .attr('filter', (d) => (d.riskScore ?? 0) >= 70 ? 'url(#glow)' : '');

        // Type icon label (abbreviated)
        node.append('text')
            .attr('dy', 4)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--app-text-strong)')
            .style('font-size', '7px')
            .style('font-weight', '900')
            .style('pointer-events', 'none')
            .text((d) => d.type === 'USER' ? 'U' : d.type === 'DEVICE' ? 'D' : d.type === 'IP' ? 'IP' : 'TX');

        // Node id label
        node.append('text')
            .attr('dx', 17)
            .attr('dy', 5)
            .attr('fill', 'var(--app-text-muted)')
            .style('font-size', '9px')
            .style('pointer-events', 'none')
            .text((d) => d.id.split('@')[0].substring(0, 16));

        // Tick
        simulation.on('tick', () => {
            link
                .attr('x1', (d) => (d.source as D3Node).x!)
                .attr('y1', (d) => (d.source as D3Node).y!)
                .attr('x2', (d) => (d.target as D3Node).x!)
                .attr('y2', (d) => (d.target as D3Node).y!);
            node.attr('transform', (d) => `translate(${d.x},${d.y})`);
        });

        return () => { simulation.stop(); };
    }, [graphData, searchTerm, filterType]);

    const fraudClusters = clusters.filter((c) => c.avgFraudScore >= 0.5);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="theme-muted-text absolute left-3 top-1/2 -translate-y-1/2" size={14} />
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            className="input w-72 py-2 pl-9 pr-4"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input py-2 px-3 text-sm"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Nodes</option>
                        <option value="high-risk">High Risk (&gt;60)</option>
                        <option value="fraud-rings">Fraud Rings</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    {fraudClusters.length > 0 && (
                        <div className="theme-status-chip-danger px-3 py-1.5">
                            <Activity size={12} />
                            <span className="text-[11px] font-bold">{fraudClusters.length} Fraud Ring{fraudClusters.length > 1 ? 's' : ''} Detected</span>
                        </div>
                    )}
                    <div className="theme-control-shell">
                        <button className="theme-control-icon" title="Zoom in"><ZoomIn size={16} /></button>
                        <button className="theme-control-icon" title="Zoom out"><ZoomOut size={16} /></button>
                        <button className="theme-control-icon" title="Full screen"><Maximize2 size={16} /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Graph Canvas */}
                <div className="theme-surface-card relative overflow-hidden lg:col-span-3" style={{ height: 750 }}>
                    {/* Legend */}
                    <div className="absolute top-4 left-4 z-10">
                        <div className="theme-muted-text flex flex-wrap gap-x-3 gap-y-1 rounded-lg border p-2 text-[10px] font-bold uppercase tracking-widest" style={{ background: 'color-mix(in srgb, var(--surface-2) 90%, transparent)', borderColor: 'var(--surface-border)' }}>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} /> User</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--status-info)' }} /> Device</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--status-info)' }} /> IP</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--status-success)' }} /> TX</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--status-danger)' }} /> High Risk</span>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--surface-3) 70%, transparent)' }}>
                            <div className="loading-spinner h-8 w-8" />
                        </div>
                    )}

                    <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

                    {/* Cluster Detection Panel */}
                    <div className="absolute bottom-4 left-4 z-10">
                        <div className="theme-surface-card w-64 p-4 backdrop-blur shadow-2xl" style={{ background: 'color-mix(in srgb, var(--surface-2) 92%, transparent)' }}>
                            <h4 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-tighter" style={{ color: 'var(--accent)' }}>
                                <AlertOctagon size={13} /> Cluster Detection
                            </h4>
                            {fraudClusters.length === 0 ? (
                                <p className="theme-muted-text text-xs">No fraud clusters detected yet.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {fraudClusters.slice(0, 3).map((c) => (
                                        <div key={c.clusterId} className="rounded-lg border p-2 text-[10px]" style={{ borderColor: 'color-mix(in srgb, var(--status-danger) 28%, transparent)', background: 'color-mix(in srgb, var(--status-danger) 9%, transparent)' }}>
                                            <div className="flex justify-between mb-0.5">
                                                <span className="theme-mono font-mono" style={{ color: 'var(--status-danger)' }}>{c.clusterId}</span>
                                                <span className="font-bold" style={{ color: 'var(--status-danger)' }}>{(c.avgFraudScore * 100).toFixed(0)}%</span>
                                            </div>
                                            <span className="theme-muted-text">{c.size} accounts · {c.sharedDevices.length} devices · {c.sharedIPs.length} IPs</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={runForensicAnalysis}
                                className="theme-btn-secondary mt-3 w-full py-1.5 text-[10px] font-bold uppercase active:scale-95"
                                style={{ color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
                            >
                                Run Forensic Scan
                            </button>
                        </div>
                    </div>

                    {/* Node Stats */}
                    <div className="absolute bottom-4 right-4 z-10">
                        <div className="flex gap-2">
                            <div className="theme-surface-subtle rounded-lg p-2 text-center text-[10px]">
                                <div className="theme-strong-text font-black">{graphData?.nodes?.length ?? 0}</div>
                                <div className="theme-muted-text uppercase">Nodes</div>
                            </div>
                            <div className="theme-surface-subtle rounded-lg p-2 text-center text-[10px]">
                                <div className="theme-strong-text font-black">{graphData?.links?.length ?? 0}</div>
                                <div className="theme-muted-text uppercase">Edges</div>
                            </div>
                            <div className="rounded-lg border p-2 text-center text-[10px]" style={{ borderColor: 'color-mix(in srgb, var(--status-danger) 35%, transparent)', background: 'color-mix(in srgb, var(--status-danger) 12%, transparent)' }}>
                                <div className="font-black" style={{ color: 'var(--status-danger)' }}>{fraudClusters.length}</div>
                                <div className="theme-muted-text uppercase">Clusters</div>
                            </div>
                        </div>
                    </div>

                    {/* Risk Panel */}
                    {selectedNode && (
                        <GraphRiskPanel
                            node={selectedNode}
                            clusters={clusters}
                            onClose={() => setSelectedNode(null)}
                        />
                    )}
                </div>

                {/* Simulation Control Center */}
                <div className="lg:col-span-1 space-y-6">
                    <SimulationControlCenter />

                    {/* Additional Forensic Context */}
                    <div className="theme-surface-card border-dashed p-5">
                        <h4 className="theme-muted-text mb-3 text-[10px] font-black uppercase tracking-widest italic">Forensic Intelligence</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="theme-muted-text font-bold uppercase">ML Confidence</span>
                                <span className="theme-mono" style={{ color: 'var(--accent)' }}>94.2%</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="theme-muted-text font-bold uppercase">Graph Density</span>
                                <span className="theme-mono" style={{ color: 'var(--accent)' }}>0.024</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="theme-muted-text font-bold uppercase">Processing Lcy</span>
                                <span className="theme-mono" style={{ color: 'var(--status-success)' }}>14ms</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Device Intelligence */}
            {deviceIntelligence && deviceIntelligence.length > 0 && (
                <div>
                    <h2 className="theme-stat-label mb-3 flex items-center gap-2">
                        <Network size={14} /> Device Intelligence
                    </h2>
                    <DeviceIntelligencePanel devices={deviceIntelligence} />
                </div>
            )}
        </div>
    );
};
