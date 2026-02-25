"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseController = void 0;
const errors_1 = require("../utils/errors");
class CaseController {
    caseService;
    constructor(caseService) {
        this.caseService = caseService;
    }
    create = async (req, res) => {
        const created = await this.caseService.create({
            transactionId: req.body.transactionId,
            alertId: req.body.alertId,
            assignedTo: req.body.assignedTo,
            status: req.body.status,
            priority: req.body.priority,
            notes: req.body.notes,
            actor: {
                actorId: req.user?.sub,
                actorEmail: req.user?.email,
                ipAddress: req.ip
            }
        });
        res.status(201).json(created);
    };
    list = async (req, res) => {
        const result = await this.caseService.list({
            page: Number(req.query.page ?? 1),
            limit: Number(req.query.limit ?? 25),
            status: req.query.status,
            priority: req.query.priority,
            assignedTo: req.query.assignedTo,
            transactionId: req.query.transactionId
        });
        res.status(200).json(result);
    };
    update = async (req, res) => {
        const updated = await this.caseService.updateByCaseId({
            caseId: req.params.id,
            status: req.body.status,
            priority: req.body.priority,
            assignedTo: req.body.assignedTo,
            note: req.body.note,
            actor: {
                actorId: req.user?.sub,
                actorEmail: req.user?.email,
                ipAddress: req.ip
            }
        });
        if (!updated) {
            throw new errors_1.AppError('Case not found', 404);
        }
        res.status(200).json(updated);
    };
}
exports.CaseController = CaseController;
