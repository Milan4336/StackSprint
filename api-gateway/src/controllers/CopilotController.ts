import { Request, Response } from 'express';
import { CopilotService } from '../services/CopilotService';
import { AppError } from '../utils/errors';

export class CopilotController {
    constructor(private readonly copilotService: CopilotService) { }

    query = async (req: Request, res: Response) => {
        const { query, context } = req.body;

        if (!query) {
            throw new AppError('Query is required', 400);
        }

        try {
            const response = await this.copilotService.processQuery(query, context);
            res.json({
                success: true,
                ...response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: (error as Error).message
            });
        }
    };

    getReport = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const response = await this.copilotService.processQuery(`/generate-report ${id}`);
            res.json({
                success: true,
                report: response.data?.report || "Report generation failed."
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: (error as Error).message
            });
        }
    };
}
