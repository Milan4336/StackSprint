import { FraudGraphService } from './FraudGraphService';
import { FraudAlertModel } from '../models/FraudAlert';
import { TransactionModel } from '../models/Transaction';
import { logger } from '../config/logger';

export interface InvestigationResult {
    entityId: string;
    type: 'TRANSACTION' | 'USER' | 'DEVICE' | 'IP';
    fraudScore: number;
    riskFactors: string[];
    relationships: {
        sharedDevices: string[];
        sharedIPs: string[];
        connectedUsers: string[];
    };
    clusterInfo?: any;
    timeline: any[];
    conclusion: string;
}

export class InvestigationEngine {
    constructor(private readonly graphService: FraudGraphService) { }

    async investigateTransaction(transactionId: string): Promise<InvestigationResult> {
        const transaction = await TransactionModel.findOne({ transactionId }).lean();
        if (!transaction) throw new Error(`Transaction ${transactionId} not found`);

        const graphData = await this.graphService.getEnrichedNetwork(100);
        const node = graphData.nodes.find(n => n.id === transactionId || n.id === transaction.userId);

        const riskFactors = [];
        if (transaction.fraudScore > 0.8) riskFactors.push('High predictive fraud score');
        if (transaction.amount > 5000) riskFactors.push('High value transaction anomaly');

        // Find shared links in graph
        const sharedDevices = graphData.links
            .filter(l => l.source === transaction.userId && l.type === 'USED_BY')
            .map(l => l.target);

        // Simple cluster detection (from ML service via graphData)
        const cluster = graphData.clusters?.find((c: any) => c.members.includes(transaction.userId));

        return {
            entityId: transactionId,
            type: 'TRANSACTION',
            fraudScore: transaction.fraudScore || 0,
            riskFactors,
            relationships: {
                sharedDevices,
                sharedIPs: [transaction.ipAddress],
                connectedUsers: cluster ? cluster.members : []
            },
            clusterInfo: cluster,
            timeline: [
                { time: transaction.timestamp, event: 'Transaction Initiated', status: 'Blocked' }
            ],
            conclusion: transaction.isFraud
                ? 'Confirmed high-risk transaction linked to potential fraud ring.'
                : 'Suspicious activity detected, pending analyst review.'
        };
    }

    async investigateUser(userId: string): Promise<InvestigationResult> {
        const transactions = await TransactionModel.find({ userId }).sort({ timestamp: -1 }).limit(20).lean();
        const avgScore = transactions.reduce((acc, tx) => acc + (tx.fraudScore || 0), 0) / (transactions.length || 1);

        return {
            entityId: userId,
            type: 'USER',
            fraudScore: avgScore,
            riskFactors: avgScore > 0.5 ? ['Persistent high-risk transaction patterns'] : ['Low risk profile'],
            relationships: {
                sharedDevices: [],
                sharedIPs: [],
                connectedUsers: []
            },
            timeline: transactions.map(tx => ({
                time: tx.timestamp,
                event: `Transaction of ${tx.amount} ${tx.currency}`,
                status: tx.isFraud ? 'FLAGGED' : 'CLEARED'
            })),
            conclusion: avgScore > 0.7 ? 'User exhibits behavior consistent with account takeover.' : 'User identity appears stable.'
        };
    }
}
