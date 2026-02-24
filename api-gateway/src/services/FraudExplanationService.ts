import { FraudExplanationItem } from '../models/FraudExplanation';
import { FraudExplanationRepository } from '../repositories/FraudExplanationRepository';

export class FraudExplanationService {
  constructor(private readonly fraudExplanationRepository: FraudExplanationRepository) {}

  async save(input: {
    transactionId: string;
    userId: string;
    fraudScore: number;
    explanations: FraudExplanationItem[];
  }): Promise<void> {
    if (!input.explanations.length) {
      return;
    }

    await this.fraudExplanationRepository.create({
      transactionId: input.transactionId,
      userId: input.userId,
      fraudScore: input.fraudScore,
      explanations: input.explanations
    });
  }

  async listRecent(limit = 50) {
    return this.fraudExplanationRepository.findRecent(limit);
  }

  async findByTransactionId(transactionId: string) {
    return this.fraudExplanationRepository.findByTransactionId(transactionId);
  }

  async findByUser(userId: string, limit = 50) {
    return this.fraudExplanationRepository.findByUser(userId, limit);
  }
}
