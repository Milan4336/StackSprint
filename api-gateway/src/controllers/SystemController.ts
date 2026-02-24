import { Request, Response } from 'express';
import { MlServiceClient } from '../services/MlServiceClient';
import { SystemHealthService } from '../services/SystemHealthService';

export class SystemController {
  constructor(
    private readonly mlServiceClient: MlServiceClient,
    private readonly systemHealthService: SystemHealthService
  ) {}

  mlStatus = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(this.mlServiceClient.getStatus());
  };

  health = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.systemHealthService.getHealth();
    res.status(200).json(result);
  };
}
