"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseService = void 0;
const uuid_1 = require("uuid");
class CaseService {
    caseRepository;
    auditService;
    constructor(caseRepository, auditService) {
        this.caseRepository = caseRepository;
        this.auditService = auditService;
    }
    async create(input) {
        const noteSeed = (input.notes ?? []).filter(Boolean);
        const created = await this.caseRepository.create({
            caseId: `case-${(0, uuid_1.v4)()}`,
            transactionId: input.transactionId,
            alertId: input.alertId,
            assignedTo: input.assignedTo,
            status: input.status ?? 'OPEN',
            priority: input.priority ?? 'MEDIUM',
            notes: noteSeed,
            timeline: [
                {
                    at: new Date(),
                    actor: input.actor?.actorEmail ?? 'system',
                    action: 'CASE_CREATED',
                    note: noteSeed[0]
                }
            ]
        });
        await this.auditService.log({
            eventType: 'CASE_CREATED',
            action: 'create',
            entityType: 'case',
            entityId: created.caseId,
            actor: input.actor,
            metadata: {
                transactionId: created.transactionId,
                priority: created.priority,
                status: created.status
            }
        });
        return created;
    }
    async list(input) {
        return this.caseRepository.list({
            page: Math.max(1, input.page ?? 1),
            limit: Math.max(1, Math.min(200, input.limit ?? 25)),
            status: input.status,
            priority: input.priority,
            assignedTo: input.assignedTo,
            transactionId: input.transactionId
        });
    }
    async updateByCaseId(input) {
        const existing = await this.caseRepository.findByCaseId(input.caseId);
        if (!existing) {
            return null;
        }
        const notes = [...existing.notes];
        if (input.note) {
            notes.push(input.note);
        }
        const timeline = [
            ...existing.timeline,
            {
                at: new Date(),
                actor: input.actor?.actorEmail ?? 'system',
                action: 'CASE_UPDATED',
                note: input.note
            }
        ];
        const updated = await this.caseRepository.updateByCaseId(input.caseId, {
            status: input.status ?? existing.status,
            priority: input.priority ?? existing.priority,
            assignedTo: input.assignedTo ?? existing.assignedTo,
            notes,
            timeline
        });
        if (updated) {
            await this.auditService.log({
                eventType: 'CASE_UPDATED',
                action: 'update',
                entityType: 'case',
                entityId: updated.caseId,
                actor: input.actor,
                metadata: {
                    status: updated.status,
                    priority: updated.priority,
                    assignedTo: updated.assignedTo
                }
            });
            if (input.assignedTo && input.assignedTo !== existing.assignedTo) {
                await this.auditService.log({
                    eventType: 'CASE_ASSIGNED',
                    action: 'assign',
                    entityType: 'case',
                    entityId: updated.caseId,
                    actor: input.actor,
                    metadata: {
                        assignedTo: input.assignedTo
                    }
                });
            }
        }
        return updated;
    }
}
exports.CaseService = CaseService;
