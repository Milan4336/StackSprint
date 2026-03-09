import { Request, Response } from 'express';
import { FraudAIAgentService } from '../services/FraudAIAgentService';
import { logger } from '../config/logger';

export class AutonomousAgentController {
    constructor(private readonly aiAgentService: FraudAIAgentService) { }

    getStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = await this.aiAgentService.getAgentStatus();
            res.status(200).json(status);
        } catch (error) {
            logger.error({ error }, 'Get AI agent status failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    toggle = async (req: Request, res: Response): Promise<void> => {
        try {
            const { active } = req.body;
            if (active) {
                this.aiAgentService.start();
            } else {
                this.aiAgentService.stop();
            }
            res.status(200).json({ status: active ? 'started' : 'stopped' });
        } catch (error) {
            logger.error({ error }, 'Toggle AI agent failed');
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
