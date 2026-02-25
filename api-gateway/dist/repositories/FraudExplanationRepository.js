"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudExplanationRepository = void 0;
const FraudExplanation_1 = require("../models/FraudExplanation");
class FraudExplanationRepository {
    async create(payload) {
        return FraudExplanation_1.FraudExplanationModel.create(payload);
    }
    async findRecent(limit = 100) {
        return FraudExplanation_1.FraudExplanationModel.find({}).sort({ createdAt: -1 }).limit(limit);
    }
    async findByTransactionId(transactionId) {
        return FraudExplanation_1.FraudExplanationModel.findOne({ transactionId }).sort({ createdAt: -1 });
    }
    async findByUser(userId, limit = 50) {
        return FraudExplanation_1.FraudExplanationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    }
}
exports.FraudExplanationRepository = FraudExplanationRepository;
