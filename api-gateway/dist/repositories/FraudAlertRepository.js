"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudAlertRepository = void 0;
const FraudAlert_1 = require("../models/FraudAlert");
class FraudAlertRepository {
    async create(payload) {
        return FraudAlert_1.FraudAlertModel.create(payload);
    }
    async findRecent(limit = 100) {
        return FraudAlert_1.FraudAlertModel.find({}).sort({ createdAt: -1 }).limit(limit);
    }
    async findByAlertId(alertId) {
        return FraudAlert_1.FraudAlertModel.findOne({ alertId });
    }
    async list(options) {
        const query = {};
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
            FraudAlert_1.FraudAlertModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            FraudAlert_1.FraudAlertModel.countDocuments(query)
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
exports.FraudAlertRepository = FraudAlertRepository;
