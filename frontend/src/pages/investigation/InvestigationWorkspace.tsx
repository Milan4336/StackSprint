import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import {
    Network,
    Search,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Filter,
    Users,
    AlertOctagon,
    Link as LinkIcon
} from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { useQuery } from '@tanstack/react-query';

interface Node extends d3.SimulationNodeDatum {
    id: string;
    type: 'user' | 'device' | 'ip' | 'transaction';
    riskScore: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
    source: string | Node;
    target: string | Node;
    type: string;
}

export const InvestigationWorkspace = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const { data: graphData, isLoading } = useQuery({
        queryKey: ['investigation-graph'],
        queryFn: () => monitoringApi.getGraph(500)
    });

    useEffect(() => {
        if (!graphData || !svgRef.current) return;

        const width = svgRef.current.clientWidth;
        const height = 600;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const g = svg.append('g');

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(zoom as any);

        const filteredNodes = graphData.nodes.filter(n => {
            const matchesSearch = n.id.toLowerCase().includes(searchTerm.toLowerCase());
            if (filterType === 'all') return matchesSearch;
            if (filterType === 'high-risk') return matchesSearch && n.riskScore > 80;
            if (filterType === 'fraud-rings') {
                return matchesSearch && (n.riskScore > 40 || graphData.links.some(l => 
                    ((l.source as any).id === n.id || (l.target as any).id === n.id || l.source === n.id || l.target === n.id) && 
                    (graphData.nodes.find(node => node.id === ((l.source as any).id === n.id ? (l.target as any).id || l.target : (l.source as any).id || l.source))?.riskScore ?? 0) > 60
                ));
            }
            return matchesSearch;
        });

        // Only include links where both source and target exist in filteredNodes
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = graphData.links.filter(l =>
            nodeIds.has((l.source as any).id || l.source) &&
            nodeIds.has((l.target as any).id || l.target)
        );

        const simulation = d3.forceSimulation<Node>(filteredNodes)
            .force('link', d3.forceLink<Node, Link>(filteredLinks).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40));

        const link = g.append('g')
            .selectAll('line')
            .data(filteredLinks)
            .join('line')
            .attr('stroke', '#334155')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1.5);

        const node = g.append('g')
            .selectAll('.node')
            .data(filteredNodes)
            .join('g')
            .attr('class', 'node')
            .call(d3.drag<any, any>()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        node.append('circle')
            .attr('r', d => d.type === 'transaction' ? 8 : 15)
            .attr('fill', d => {
                if (d.riskScore > 80) return '#ef4444';
                if (d.riskScore > 50) return '#f59e0b';
                return d.type === 'user' ? '#3b82f6' : '#10b981';
            })
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2);

        node.append('text')
            .attr('dx', 20)
            .attr('dy', 5)
            .text(d => d.id.split('@')[0])
            .attr('fill', '#94a3b8')
            .style('font-size', '10px')
            .style('pointer-events', 'none');

        simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as Node).x!)
                .attr('y1', d => (d.source as Node).y!)
                .attr('x2', d => (d.target as Node).x!)
                .attr('y2', d => (d.target as Node).y!);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

    }, [graphData, searchTerm, filterType]);

    const runForensicAnalysis = () => {
        if (!graphData || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        const g = svg.select('g');

        svg.transition()
            .duration(200)
            .style('filter', 'brightness(2) saturate(2) drop-shadow(0 0 20px #3b82f6)')
            .transition()
            .duration(800)
            .style('filter', 'none');

        g.selectAll('.node circle')
            .transition()
            .duration(500)
            .attr('r', (d: any) => d.riskScore > 70 ? 25 : (d.type === 'transaction' ? 8 : 15))
            .style('stroke', (d: any) => d.riskScore > 70 ? '#fff' : '#0f172a')
            .style('stroke-width', (d: any) => d.riskScore > 70 ? 4 : 2)
            .transition()
            .duration(2000)
            .attr('r', (d: any) => d.type === 'transaction' ? 8 : 15)
            .style('stroke', '#0f172a')
            .style('stroke-width', 2);

        const scanline = svg.append('rect')
            .attr('width', '100%')
            .attr('height', 2)
            .attr('fill', 'rgba(59, 130, 246, 0.5)')
            .attr('y', 0);

        scanline.transition()
            .duration(1500)
            .attr('y', 600)
            .remove();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search entities or clusters..."
                            className="w-80 rounded-xl bg-slate-900 border border-slate-800 py-2 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-blue-500/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="rounded-xl bg-slate-900 border border-slate-800 py-2 px-4 text-sm text-slate-300 outline-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Clusters</option>
                        <option value="high-risk">High Risk Nodes</option>
                        <option value="fraud-rings">Fraud Rings</option>
                    </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><ZoomIn size={18} /></button>
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><ZoomOut size={18} /></button>
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Maximize2 size={18} /></button>
                </div>
            </div>

            <div className="flex-1 relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-blue-500" /> User
                        <span className="h-2 w-2 rounded-full bg-emerald-500 ml-2" /> Device
                        <span className="h-2 w-2 rounded-full bg-red-500 ml-2" /> Fraud Alert
                    </div>
                </div>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 z-20">
                        <div className="loading-spinner h-8 w-8" />
                    </div>
                )}

                <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

                <div className="absolute bottom-4 right-4 z-10 space-y-2">
                    <div className="panel p-4 w-64 bg-slate-900/90 backdrop-blur border-blue-500/20">
                        <h4 className="flex items-center gap-2 text-xs font-black uppercase text-blue-400 tracking-tighter">
                            <AlertOctagon size={14} /> Cluster Detection
                        </h4>
                        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                            Detected <span className="text-white font-bold">12</span> suspicious links connecting <span className="text-white font-bold">4</span> diverse IP clusters.
                        </p>
                        <button
                            onClick={runForensicAnalysis}
                            className="mt-3 w-full py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold uppercase transition hover:bg-blue-600/30 active:scale-95"
                        >
                            Run Forensic Analysis
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
