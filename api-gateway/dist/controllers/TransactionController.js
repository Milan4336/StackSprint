"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const errors_1 = require("../utils/errors");
class TransactionController {
    transactionService;
    constructor(transactionService) {
        this.transactionService = transactionService;
    }
    toDate(raw) {
        if (!raw)
            return undefined;
        const next = new Date(String(raw));
        return Number.isNaN(next.getTime()) ? undefined : next;
    }
    create = async (req, res) => {
        const created = await this.transactionService.create({
            ...req.body,
            timestamp: new Date(req.body.timestamp)
        });
        res.status(201).json(created);
    };
    list = async (req, res) => {
        const limit = Number(req.query.limit ?? 100);
        const result = await this.transactionService.list(limit);
        res.status(200).json(result);
    };
    query = async (req, res) => {
        const result = await this.transactionService.query({
            page: Number(req.query.page ?? 1),
            limit: Number(req.query.limit ?? 25),
            search: req.query.search ?? undefined,
            riskLevel: req.query.riskLevel,
            userId: req.query.userId,
            deviceId: req.query.deviceId,
            minAmount: req.query.minAmount !== undefined ? Number(req.query.minAmount) : undefined,
            maxAmount: req.query.maxAmount !== undefined ? Number(req.query.maxAmount) : undefined,
            startDate: this.toDate(req.query.startDate),
            endDate: this.toDate(req.query.endDate),
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        });
        res.status(200).json(result);
    };
    byId = async (req, res) => {
        const result = await this.transactionService.findByTransactionId(req.params.transactionId);
        if (!result) {
            throw new errors_1.AppError('Transaction not found', 404);
        }
        res.status(200).json(result);
    };
    stats = async (_req, res) => {
        const result = await this.transactionService.stats();
        res.status(200).json(result);
    };
}
exports.TransactionController = TransactionController;
