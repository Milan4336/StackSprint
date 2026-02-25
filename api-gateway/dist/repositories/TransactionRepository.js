"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const Transaction_1 = require("../models/Transaction");
class TransactionRepository {
    async create(payload) {
        return Transaction_1.TransactionModel.create(payload);
    }
    async findByUserWithinWindow(userId, from) {
        return Transaction_1.TransactionModel.find({ userId, timestamp: { $gte: from } }).sort({ timestamp: -1 });
    }
    async findLatestByUser(userId) {
        return Transaction_1.TransactionModel.findOne({ userId }).sort({ timestamp: -1 });
    }
    async findByTransactionId(transactionId) {
        return Transaction_1.TransactionModel.findOne({ transactionId });
    }
    async findByUser(userId, limit = 100) {
        return Transaction_1.TransactionModel.find({ userId }).sort({ timestamp: -1 }).limit(limit);
    }
    async findRecent(limit = 100) {
        return Transaction_1.TransactionModel.find({}).sort({ timestamp: -1 }).limit(limit);
    }
    async query(options) {
        const query = {};
        if (options.riskLevel)
            query.riskLevel = options.riskLevel;
        if (options.userId)
            query.userId = options.userId;
        if (options.deviceId)
            query.deviceId = options.deviceId;
        if (options.minAmount !== undefined || options.maxAmount !== undefined) {
            query.amount = {};
            if (options.minAmount !== undefined) {
                query.amount.$gte = options.minAmount;
            }
            if (options.maxAmount !== undefined) {
                query.amount.$lte = options.maxAmount;
            }
        }
        if (options.startDate || options.endDate) {
            query.timestamp = {};
            if (options.startDate) {
                query.timestamp.$gte = options.startDate;
            }
            if (options.endDate) {
                query.timestamp.$lte = options.endDate;
            }
        }
        if (options.search) {
            const safe = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { transactionId: { $regex: safe, $options: 'i' } },
                { userId: { $regex: safe, $options: 'i' } },
                { deviceId: { $regex: safe, $options: 'i' } },
                { location: { $regex: safe, $options: 'i' } },
                { country: { $regex: safe, $options: 'i' } }
            ];
        }
        const sortBy = options.sortBy ?? 'timestamp';
        const direction = options.sortOrder === 'asc' ? 1 : -1;
        const skip = (Math.max(1, options.page) - 1) * Math.max(1, options.limit);
        const limit = Math.max(1, Math.min(500, options.limit));
        const [data, total] = await Promise.all([
            Transaction_1.TransactionModel.find(query)
                .sort({ [sortBy]: direction })
                .skip(skip)
                .limit(limit),
            Transaction_1.TransactionModel.countDocuments(query)
        ]);
        return {
            data,
            total,
            page: Math.max(1, options.page),
            limit,
            pages: Math.max(1, Math.ceil(total / limit))
        };
    }
    async getStats() {
        const [result] = await Transaction_1.TransactionModel.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    fraudCount: { $sum: { $cond: ['$isFraud', 1, 0] } },
                    avgScore: { $avg: '$fraudScore' }
                }
            }
        ]);
        return {
            total: result?.total ?? 0,
            fraudCount: result?.fraudCount ?? 0,
            avgScore: result?.avgScore ?? 0
        };
    }
    async topHighRiskUsers(limit = 5) {
        return Transaction_1.TransactionModel.aggregate([
            { $match: { riskLevel: 'High' } },
            { $group: { _id: '$userId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            { $project: { _id: 0, userId: '$_id', count: 1 } }
        ]);
    }
    async fraudByCountry(limit = 10) {
        return Transaction_1.TransactionModel.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$country', 'Unknown'] },
                    total: { $sum: 1 },
                    fraudCount: { $sum: { $cond: ['$isFraud', 1, 0] } }
                }
            },
            { $sort: { fraudCount: -1 } },
            { $limit: limit },
            { $project: { _id: 0, country: '$_id', fraudCount: 1, total: 1 } }
        ]);
    }
}
exports.TransactionRepository = TransactionRepository;
