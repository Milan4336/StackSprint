"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringController = void 0;
const errors_1 = require("../utils/errors");
class MonitoringController {
    fraudAlertRepository;
    userDeviceRepository;
    fraudExplanationService;
    transactionRepository;
    caseRepository;
    constructor(fraudAlertRepository, userDeviceRepository, fraudExplanationService, transactionRepository, caseRepository) {
        this.fraudAlertRepository = fraudAlertRepository;
        this.userDeviceRepository = userDeviceRepository;
        this.fraudExplanationService = fraudExplanationService;
        this.transactionRepository = transactionRepository;
        this.caseRepository = caseRepository;
    }
    alerts = async (req, res) => {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 100);
        const status = req.query.status;
        const search = req.query.search;
        if (req.query.page || req.query.status || req.query.search) {
            const result = await this.fraudAlertRepository.list({
                page: Math.max(1, page),
                limit: Math.max(1, Math.min(500, limit)),
                status,
                search
            });
            res.status(200).json(result);
            return;
        }
        const result = await this.fraudAlertRepository.findRecent(Math.max(1, Math.min(500, limit)));
        res.status(200).json(result);
    };
    alertDetails = async (req, res) => {
        const alertId = req.params.alertId;
        const alert = await this.fraudAlertRepository.findByAlertId(alertId);
        if (!alert) {
            throw new errors_1.AppError('Alert not found', 404);
        }
        const tx = await this.transactionRepository.findByTransactionId(alert.transactionId);
        const userId = tx?.userId ?? alert.userId;
        const [history, devices, explanations, relatedCases] = await Promise.all([
            this.transactionRepository.findByUser(userId, 30),
            this.userDeviceRepository.findByUser(userId, 30),
            this.fraudExplanationService.findByUser(userId, 20),
            this.caseRepository.list({ page: 1, limit: 20, transactionId: alert.transactionId })
        ]);
        res.status(200).json({
            alert,
            transaction: tx,
            userHistory: history,
            devices,
            explanations,
            cases: relatedCases.data
        });
    };
    devices = async (req, res) => {
        const limit = Number(req.query.limit ?? 200);
        const result = await this.userDeviceRepository.findRecent(Math.max(1, Math.min(1000, limit)));
        res.status(200).json(result);
    };
    explanations = async (req, res) => {
        const limit = Number(req.query.limit ?? 100);
        const result = await this.fraudExplanationService.listRecent(Math.max(1, Math.min(500, limit)));
        res.status(200).json(result);
    };
}
exports.MonitoringController = MonitoringController;
