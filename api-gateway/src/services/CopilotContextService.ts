import { TransactionModel } from '../models/Transaction';
import { FraudAlertModel } from '../models/FraudAlert';
import { Device } from '../models/Device';
import { UserModel } from '../models/User';
import { AuditLogModel } from '../models/AuditLog';
import { FraudGraphService } from './FraudGraphService';
import { logger } from '../config/logger';

export interface InvestigationContext {
    transaction?: any;
    user?: any;
    device?: any;
    ipAddress?: string;
    alerts: any[];
    relatedEntities: any;
    systemThreatIndex: number;
}

export class CopilotContextService {
    constructor(private readonly graphService: FraudGraphService) { }

    async getContextForTransaction(transactionId: string): Promise<InvestigationContext> {
        const transaction = await TransactionModel.findOne({ transactionId }).lean();
        if (!transaction) throw new Error(`Transaction ${transactionId} not found`);

        const [user, device, alerts, graphData] = await Promise.all([
            UserModel.findOne({ userId: transaction.userId }).lean(),
            Device.findOne({ deviceId: transaction.deviceId }).lean(),
            FraudAlertModel.find({ transactionId }).sort({ createdAt: -1 }).lean(),
            this.graphService.getEnrichedNetwork(50)
        ]);

        return {
            transaction,
            user,
            device,
            ipAddress: transaction.ipAddress,
            alerts,
            relatedEntities: graphData,
            systemThreatIndex: 0.45 // Mocked for now, usually from SystemMetrics
        };
    }

    async getContextForUser(userId: string): Promise<InvestigationContext> {
        const user = await UserModel.findOne({ userId }).lean();
        if (!user) throw new Error(`User ${userId} not found`);

        const [transactions, alerts, graphData] = await Promise.all([
            TransactionModel.find({ userId }).sort({ timestamp: -1 }).limit(10).lean(),
            FraudAlertModel.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
            this.graphService.getEnrichedNetwork(50)
        ]);

        return {
            user,
            transaction: transactions[0],
            alerts,
            relatedEntities: graphData,
            systemThreatIndex: 0.45
        };
    }

    async getLatestSystemContext(): Promise<any> {
        const latestAlerts = await FraudAlertModel.find().sort({ createdAt: -1 }).limit(5).lean();
        return {
            latestAlerts,
            systemThreatIndex: 0.45,
            timestamp: new Date()
        };
    }
}
