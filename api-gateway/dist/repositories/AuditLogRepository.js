"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogRepository = void 0;
const AuditLog_1 = require("../models/AuditLog");
class AuditLogRepository {
    async create(payload) {
        return AuditLog_1.AuditLogModel.create(payload);
    }
    async listRecent(limit = 200) {
        return AuditLog_1.AuditLogModel.find({}).sort({ createdAt: -1 }).limit(limit);
    }
}
exports.AuditLogRepository = AuditLogRepository;
