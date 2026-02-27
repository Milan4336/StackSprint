import { Request, Response } from 'express';
import { MlServiceClient } from '../services/MlServiceClient';
import { ModelMetricsService } from '../services/ModelMetricsService';

export class ModelController {
  constructor(
    private readonly mlServiceClient: MlServiceClient,
    private readonly modelMetricsService: ModelMetricsService
  ) { }

  info = async (_req: Request, res: Response): Promise<void> => {
    const info = await this.mlServiceClient.fetchRemoteModelInfo();
    res.status(200).json(info);
  };

  health = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 100);
    const [latest, metrics] = await Promise.all([
      this.modelMetricsService.latest(),
      this.modelMetricsService.listRecent(Math.max(1, Math.min(500, limit)))
    ]);
    res.status(200).json({ latest, metrics });
  };
}
