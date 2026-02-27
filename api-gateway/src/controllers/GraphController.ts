import { Request, Response } from 'express';
import { FraudGraphEdgeModel } from '../models/FraudGraphEdge';

export class GraphController {
    getNetwork = async (req: Request, res: Response): Promise<void> => {
        const limit = Number(req.query.limit ?? 200);

        // Fetch professional relationship edges
        const edges = await FraudGraphEdgeModel.find()
            .sort({ lastSeenAt: -1 })
            .limit(limit);

        // Transform into Nodes and Links for D3
        const nodesMap = new Map();
        const links: any[] = [];

        edges.forEach((edge: any) => {
            // Add source node
            if (!nodesMap.has(edge.fromId)) {
                nodesMap.set(edge.fromId, {
                    id: edge.fromId,
                    type: edge.fromType,
                    val: 5
                });
            }

            // Add target node
            if (!nodesMap.has(edge.toId)) {
                nodesMap.set(edge.toId, {
                    id: edge.toId,
                    type: edge.toType,
                    val: edge.toType === 'USER' ? 6 : 4
                });
            }

            // Add link
            links.push({
                source: edge.fromId,
                target: edge.toId,
                value: edge.weight,
                type: edge.relationshipType
            });
        });

        res.status(200).json({
            nodes: Array.from(nodesMap.values()),
            links
        });
    };
}
