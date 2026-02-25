"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
class AuditService {
    auditLogRepository;
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async log(input) {
        await this.auditLogRepository.create({
            eventType: input.eventType,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            actorId: input.actor?.actorId,
            actorEmail: input.actor?.actorEmail,
            ipAddress: input.actor?.ipAddress,
            metadata: input.metadata ?? {}
        });
    }
    async listRecent(limit = 200) {
        return this.auditLogRepository.listRecent(limit);
    }
}
exports.AuditService = AuditService;
