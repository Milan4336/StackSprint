import { FraudGraphEdgeModel } from '../models/FraudGraphEdge';
import { TransactionModel } from '../models/Transaction';
import { logger } from '../config/logger';

export interface MuleDetectionResult {
    isMule: boolean;
    confidence: number;
    reason?: string;
}

export class MuleDetectionService {
    /**
     * Identifies potential "Mule" activity based on graph clusters and transaction patterns.
     * Since explicit recipient tracking is limited, we focus on users acting as "infrastructure hubs"
     * for high-risk devices/IPs.
     */
    async detectMule(userId: string): Promise<MuleDetectionResult> {
        try {
            // 1. Check for shared device/IP pressure
            const connections = await FraudGraphEdgeModel.find({
                fromId: userId,
                fromType: 'USER'
            }).lean();

            const sharedEntities = connections.filter(c => ['DEVICE', 'IP'].includes(c.toType));
            
            // If a user is connected to > 3 high-risk entities, flag as potential mule manager/account
            const highRiskConnections = sharedEntities.filter(c => (c.fraudScore ?? 0) > 0.6);

            if (highRiskConnections.length >= 3) {
                return {
                    isMule: true,
                    confidence: 0.85,
                    reason: `User connected to ${highRiskConnections.length} high-risk devices/IPs in the graph.`
                };
            }

            // 2. Transaction Siphon Simulation (High Volume Anomaly)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentTxs = await TransactionModel.find({
                userId,
                timestamp: { $gte: oneHourAgo }
            }).lean();

            if (recentTxs.length >= 10) {
                return {
                    isMule: true,
                    confidence: 0.7,
                    reason: `High transaction frequency (${recentTxs.length}/hr) typical of automated funneling.`
                };
            }

            return { isMule: false, confidence: 0 };
        } catch (error) {
            logger.error({ error, userId }, 'MuleDetectionService failed');
            return { isMule: false, confidence: 0 };
        }
    }
}
