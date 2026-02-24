import { FraudAlertDocument, FraudAlertModel } from '../models/FraudAlert';

export class FraudAlertRepository {
  async create(payload: Partial<FraudAlertDocument>): Promise<FraudAlertDocument> {
    return FraudAlertModel.create(payload);
  }

  async findRecent(limit = 100): Promise<FraudAlertDocument[]> {
    return FraudAlertModel.find({}).sort({ createdAt: -1 }).limit(limit);
  }

  async findByAlertId(alertId: string): Promise<FraudAlertDocument | null> {
    return FraudAlertModel.findOne({ alertId });
  }

  async list(options: {
    page: number;
    limit: number;
    status?: 'open' | 'investigating' | 'resolved';
    search?: string;
  }): Promise<{ data: FraudAlertDocument[]; total: number; page: number; limit: number; pages: number }> {
    const query: Record<string, unknown> = {};
    if (options.status) {
      query.status = options.status;
    }
    if (options.search) {
      const safe = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { alertId: { $regex: safe, $options: 'i' } },
        { transactionId: { $regex: safe, $options: 'i' } },
        { userId: { $regex: safe, $options: 'i' } },
        { reason: { $regex: safe, $options: 'i' } }
      ];
    }

    const limit = Math.max(1, Math.min(500, options.limit));
    const page = Math.max(1, options.page);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      FraudAlertModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      FraudAlertModel.countDocuments(query)
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    };
  }
}
