import { Request, Response } from 'express';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { UserDeviceRepository } from '../repositories/UserDeviceRepository';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export class EntityController {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly userDeviceRepository: UserDeviceRepository,
        private readonly fraudAlertRepository: FraudAlertRepository,
        private readonly userRepository: UserRepository
    ) { }

    getEntityById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id as string;

            // Attempt to find user, device, or IP context
            const user = await this.userRepository.findByEmail(id);
            const device = await this.userDeviceRepository.findById(id);

            const transactions = await this.transactionRepository.find({
                $or: [{ userId: id }, { deviceId: id }, { ipAddress: id }]
            }, 50);

            const alerts = await this.fraudAlertRepository.find({
                $or: [{ userId: id }, { deviceId: id }]
            }, 20);

            res.status(200).json({
                id,
                user,
                device,
                transactions,
                alerts,
                riskScore: user?.riskScore || 0,
                type: user ? 'user' : (device ? 'device' : 'ip')
            });
        } catch (error) {
            logger.error({ error }, 'Get entity failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getTimeline = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id as string;

            const transactions = await this.transactionRepository.find({
                $or: [{ userId: id }, { deviceId: id }, { ipAddress: id }]
            }, 100);

            const timeline = transactions.map((t: any) => ({
                id: t.transactionId,
                at: t.timestamp,
                type: 'TRANSACTION',
                amount: t.amount,
                riskScore: t.riskScore,
                status: t.status,
                metadata: {
                    merchant: t.merchantId,
                    location: t.location
                }
            })).sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime());

            res.status(200).json(timeline);
        } catch (error) {
            logger.error({ error }, 'Get timeline failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
