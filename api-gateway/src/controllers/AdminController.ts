import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { DeviceReputation } from '../models/DeviceReputation';
import { TransactionModel } from '../models/Transaction';
import { AuditService } from '../services/AuditService';

export class AdminController {
    constructor(private readonly auditService: AuditService) { }

    unfreezeUser = async (req: Request, res: Response) => {
        const { userId } = req.body;
        const user = await UserModel.findOneAndUpdate({ userId }, { status: 'ACTIVE' }, { new: true });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        await this.auditService.log({
            eventType: 'admin.unfreeze_user',
            action: 'update',
            entityType: 'user',
            entityId: userId,
            metadata: { reason: 'Admin manual override' }
        });

        res.json({ success: true, user });
    };

    unfreezeDevice = async (req: Request, res: Response) => {
        const { deviceId } = req.body;
        const device = await DeviceReputation.findOneAndUpdate({ deviceId }, { riskLevel: 'Low' }, { new: true });

        if (!device) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }

        await this.auditService.log({
            eventType: 'admin.unfreeze_device',
            action: 'update',
            entityType: 'device',
            entityId: deviceId,
            metadata: { reason: 'Admin manual override' }
        });

        res.json({ success: true, device });
    };

    releaseTransaction = async (req: Request, res: Response) => {
        const { transactionId } = req.body;
        const transaction = await TransactionModel.findOneAndUpdate({ transactionId }, { action: 'ALLOW' }, { new: true });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        await this.auditService.log({
            eventType: 'admin.release_transaction',
            action: 'update',
            entityType: 'transaction',
            entityId: transactionId,
            metadata: { reason: 'Admin manual override' }
        });

        res.json({ success: true, transaction });
    };
}
