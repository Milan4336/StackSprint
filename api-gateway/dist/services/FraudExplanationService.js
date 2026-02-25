"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudExplanationService = void 0;
class FraudExplanationService {
    fraudExplanationRepository;
    constructor(fraudExplanationRepository) {
        this.fraudExplanationRepository = fraudExplanationRepository;
    }
    async save(input) {
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
    async findByTransactionId(transactionId) {
        return this.fraudExplanationRepository.findByTransactionId(transactionId);
    }
    async findByUser(userId, limit = 50) {
        return this.fraudExplanationRepository.findByUser(userId, limit);
    }
}
exports.FraudExplanationService = FraudExplanationService;
