import { Request, Response } from 'express';
import { CaseService } from '../services/CaseService';
import { AppError } from '../utils/errors';

export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const created = await this.caseService.create({
      transactionId: req.body.transactionId,
      alertId: req.body.alertId,
      assignedTo: req.body.assignedTo,
      status: req.body.status,
      priority: req.body.priority,
      notes: req.body.notes,
      actor: {
        actorId: req.user?.sub,
        actorEmail: req.user?.email,
        ipAddress: req.ip
      }
    });
    res.status(201).json(created);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.caseService.list({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 25),
      status: req.query.status as 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE' | undefined,
      priority: req.query.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined,
      assignedTo: req.query.assignedTo as string | undefined,
      transactionId: req.query.transactionId as string | undefined
    });
    res.status(200).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const updated = await this.caseService.updateByCaseId({
      caseId: req.params.id as string,
      status: req.body.status,
      priority: req.body.priority,
      assignedTo: req.body.assignedTo,
      note: req.body.note,
      actor: {
        actorId: req.user?.sub,
        actorEmail: req.user?.email,
        ipAddress: req.ip
      }
    });

    if (!updated) {
      throw new AppError('Case not found', 404);
    }
    res.status(200).json(updated);
  };
}
