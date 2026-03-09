import { Request, Response } from 'express';
import { TransactionModel } from '../models/Transaction';
import { Device } from '../models/Device';
import { AuditLogModel } from '../models/AuditLog';
import { FraudAlertModel } from '../models/FraudAlert';
import { CaseModel } from '../models/Case';
import { UserModel } from '../models/User';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export class PortalController {

    getDashboard = async (req: Request, res: Response): Promise<void> => {
        try {
            const email = (req as any).user.email;
            const user = await UserModel.findOne({ email });

            if (!user) throw new AppError('User not found', 404);

            const recentTransactions = await TransactionModel.find({ userId: user.userId || email })
                .sort({ timestamp: -1 })
                .limit(5);

            const activeDevices = await Device.find({ userId: user.userId || email })
                .sort({ lastSeen: -1 })
                .limit(3);

            res.status(200).json({
                user: {
                    fullName: user.fullName,
                    email: user.email,
                    identitySafetyScore: user.identitySafetyScore,
                    riskScore: user.riskScore,
                    mfaEnabled: user.mfaEnabled,
                    status: user.status
                },
                recentTransactions,
                activeDevices
            });
        } catch (error) {
            logger.error({ error }, 'Portal dashboard failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getTransactions = async (req: Request, res: Response): Promise<void> => {
        try {
            const email = (req as any).user.email;
            const transactions = await TransactionModel.find({ userId: email })
                .sort({ timestamp: -1 });
            res.status(200).json(transactions);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getDevices = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.sub;
            const email = (req as any).user.email;
            const devices = await Device.find({ userId: userId || email })
                .sort({ lastSeen: -1 });
            res.status(200).json(devices);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getLoginHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const email = (req as any).user.email;
            const logs = await AuditLogModel.find({
                actorEmail: email,
                eventType: 'AUTH_LOGIN'
            }).sort({ timestamp: -1 });
            res.status(200).json(logs);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getAlerts = async (req: Request, res: Response): Promise<void> => {
        try {
            const email = (req as any).user.email;
            const alerts = await FraudAlertModel.find({
                userId: email,
                status: { $ne: 'resolved' }
            }).sort({ timestamp: -1 });
            res.status(200).json(alerts);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    reportFraud = async (req: Request, res: Response): Promise<void> => {
        try {
            const email = (req as any).user.email;
            const { transactionId, notes } = req.body;

            const newCase = new CaseModel({
                caseId: `USER_REPORT_${Date.now()}`,
                userId: email,
                transactionId,
                caseStatus: 'NEW',
                priority: 'HIGH',
                source: 'user_report',
                caseNotes: [notes || 'User reported suspicious activity via portal']
            });

            await newCase.save();
            res.status(201).json(newCase);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
