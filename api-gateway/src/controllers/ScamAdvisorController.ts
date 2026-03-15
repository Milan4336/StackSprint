import { Request, Response } from 'express';
import { scamAdvisorService } from '../services/ScamAdvisorService';
import { logger } from '../config/logger';

export class ScamAdvisorController {
    public analyze = async (req: Request, res: Response) => {
        try {
            const { content, type } = req.body;
            if (!content) {
                return res.status(400).json({ error: 'Content is required for analysis' });
            }

            const result = await scamAdvisorService.analyzeContent(content, type || 'text');
            res.json(result);
        } catch (error) {
            logger.error({ error }, 'ScamAdvisorController.analyze failed');
            res.status(500).json({ error: 'Internal server error during analysis' });
        }
    };
}

export const scamAdvisorController = new ScamAdvisorController();
