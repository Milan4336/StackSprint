"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
class AuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    list = async (req, res) => {
        const limit = Number(req.query.limit ?? 200);
        const result = await this.auditService.listRecent(Math.max(1, Math.min(1000, limit)));
        res.status(200).json(result);
    };
}
exports.AuditController = AuditController;
