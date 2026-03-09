"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudAlertRepository = void 0;
const FraudAlert_1 = require("../models/FraudAlert");
class FraudAlertRepository {
    async find(query = {}, limit = 100) {
        return FraudAlert_1.FraudAlertModel.find(query).limit(limit).sort({ createdAt: -1 });
    }
    async create(payload) {
        return FraudAlert_1.FraudAlertModel.create(payload);
    }
    async findRecent(limit = 100) {
        return FraudAlert_1.FraudAlertModel.find({})
            .limit(Number(limit))
            .exec();
    }
    async findByUser(userId, limit = 50) {
        return FraudAlert_1.FraudAlertModel.find({ userId })
            .limit(Number(limit))
            .exec();
    }
    async findAll(limit = 100, skip = 0) {
        return FraudAlert_1.FraudAlertModel.find({})
            .skip(Number(skip))
            .limit(Number(limit))
            .exec();
    }
    async list(options = {}) {
        const page = Math.max(1, Number(options.page ?? 1));
        const limit = Math.max(1, Math.min(500, Number(options.limit ?? 100)));
        const skip = (page - 1) * limit;
        const query = {};
        if (options.status) {
            query.status = options.status;
        }
        if (options.search) {
            query.$or = [
                { transactionId: { $regex: options.search, $options: 'i' } },
                { userId: { $regex: options.search, $options: 'i' } }
            ];
        }
        const [data, total] = await Promise.all([
            FraudAlert_1.FraudAlertModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
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
    async findByAlertId(alertId) {
        return FraudAlert_1.FraudAlertModel.findOne({ alertId }).exec();
    }
}
exports.FraudAlertRepository = FraudAlertRepository;
