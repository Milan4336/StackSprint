import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { Activity, Shield, Users, Network, Info, RefreshCw } from 'lucide-react';

interface Node extends d3.SimulationNodeDatum {
    id: string;
    type: 'USER' | 'DEVICE' | 'IP';
    val: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
    source: string | Node;
    target: string | Node;
    value: number;
    type?: string;
}

export const FraudNetwork = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const graphQuery = useQuery({
        queryKey: ['fraud-network'],
        queryFn: () => monitoringApi.getGraph(300),
        refetchInterval: 10000 // Update every 10s
    });

    useEffect(() => {
        if (!svgRef.current || !graphQuery.data) return;

        const { nodes, links } = graphQuery.data;
        const width = 800;
        const height = 500;

        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`);

        svg.selectAll("*").remove();

        const simulation = d3.forceSimulation<Node>(nodes as Node[])
            .force("link", d3.forceLink<Node, Link>(links as Link[]).id((d: Node) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .attr("stroke", "#94a3b8")
            .attr("stroke-opacity", 0.4)
            .selectAll<SVGLineElement, Link>("line")
            .data(links as Link[])
            .join("line")
            .attr("stroke-width", (d: Link) => Math.sqrt(d.value || 1) * 2);

        const node = svg.append("g")
            .selectAll<SVGCircleElement, Node>("circle")
            .data(nodes as Node[])
            .join("circle")
            .attr("r", (d: Node) => (d.val || 5) * 2)
            .attr("fill", (d: Node) => d.type === 'USER' ? '#3b82f6' : d.type === 'DEVICE' ? '#8b5cf6' : '#f59e0b')
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .call(d3.drag<SVGCircleElement, Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("click", (_event: any, d: Node) => setSelectedNode(d));

        node.append("title")
            .text((d: Node) => d.id);

        simulation.on("tick", () => {
            link
                .attr("x1", (d: Link) => (d.source as Node).x!)
                .attr("y1", (d: Link) => (d.source as Node).y!)
                .attr("x2", (d: Link) => (d.target as Node).x!)
                .attr("y2", (d: Link) => (d.target as Node).y!);

            node
                .attr("cx", (d: Node) => d.x!)
                .attr("cy", (d: Node) => d.y!);
        });

        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return () => {
            simulation.stop();
        };
    }, [graphQuery.data]);

    return (
        <div className="space-y-6 pb-12">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
                        <Network className="text-blue-500" strokeWidth={3} /> Fraud Relationship Graph
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Realtime network analysis detecting shared devices, collusion, and fraud rings.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => graphQuery.refetch()}
                        className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    >
                        <RefreshCw size={12} className={`mr-1 ${graphQuery.isFetching ? 'animate-spin' : ''}`} /> Update Data
                    </button>
                    <div className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                        <Activity size={12} className="mr-1" /> Live Sync: {graphQuery.data?.nodes.length ?? 0} Nodes
                    </div>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                <div className="panel overflow-hidden p-0 relative min-h-[500px] border-2 border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm">
                    {graphQuery.isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <RefreshCw className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : (
                        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                    )}

                    {/* Legend */}
                    <div className="absolute bottom-6 left-6 space-y-2 glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <div className="h-3 w-3 rounded-full bg-blue-500" /> Users
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <div className="h-3 w-3 rounded-full bg-purple-500" /> Devices
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <div className="h-3 w-3 rounded-full bg-amber-500" /> IP Addresses
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <motion.div
                        key={selectedNode?.id || 'none'}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="panel glass-panel border-blue-500/30 dark:bg-blue-600/5"
                    >
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Info size={14} /> Node Intelligence
                        </h3>
                        {selectedNode ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xl font-black text-slate-800 dark:text-slate-100 truncate">{selectedNode.id}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{selectedNode.type} ENTITY</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Live Degree</p>
                                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">
                                            {graphQuery.data?.links.filter(l =>
                                                (typeof l.source === 'string' ? l.source === selectedNode.id : l.source.id === selectedNode.id) ||
                                                (typeof l.target === 'string' ? l.target === selectedNode.id : l.target.id === selectedNode.id)
                                            ).length ?? 0}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Risk Bias</p>
                                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">0.15<span className="text-xs text-blue-500 font-bold ml-1">AVG</span></p>
                                    </div>
                                </div>
                                <button className="w-full glass-btn justify-center border-blue-500/40 text-blue-500 font-black text-xs uppercase tracking-widest">
                                    Analyze Network Clusters
                                </button>
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <Activity className="mx-auto text-slate-300 mb-3" size={32} />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select an entity to analyze</p>
                            </div>
                        )}
                    </motion.div>

                    <div className="panel border-dashed border-red-500/30">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Collusion Engine</h3>
                        {graphQuery.data && graphQuery.data.links.some(l => l.value > 2) ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <span className="text-xs font-bold text-red-500">COLLUSION_DETECTED</span>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-500 text-white animate-pulse">CRITICAL</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                                    Multiple users sharing entities detected. High probability of fraud ring or device sharing bypass.
                                </p>
                            </div>
                        ) : (
                            <div className="py-6 text-center">
                                <Shield className="mx-auto text-emerald-500/30 mb-2" size={24} />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">No active collusion clusters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
