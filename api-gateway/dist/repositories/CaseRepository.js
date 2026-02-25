"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseRepository = void 0;
const Case_1 = require("../models/Case");
class CaseRepository {
    async create(payload) {
        return Case_1.CaseModel.create(payload);
    }
    async updateByCaseId(caseId, updates) {
        return Case_1.CaseModel.findOneAndUpdate({ caseId }, updates, { new: true });
    }
    async findByCaseId(caseId) {
        return Case_1.CaseModel.findOne({ caseId });
    }
    async list(filters) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        if (filters.priority)
            query.priority = filters.priority;
        if (filters.assignedTo)
            query.assignedTo = filters.assignedTo;
        if (filters.transactionId)
            query.transactionId = filters.transactionId;
        const skip = (filters.page - 1) * filters.limit;
        const [data, total] = await Promise.all([
            Case_1.CaseModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(filters.limit),
            Case_1.CaseModel.countDocuments(query)
        ]);
        return {
            data,
            total,
            page: filters.page,
            limit: filters.limit,
            pages: Math.max(1, Math.ceil(total / filters.limit))
        };
    }
}
exports.CaseRepository = CaseRepository;
