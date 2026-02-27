"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const uuid_1 = require("uuid");
class TransactionService {
    transactionRepository;
    fraudScoringService;
    eventBusService;
    autonomousResponseService;
    deviceFingerprintService;
    fraudExplanationService;
    geoService;
    auditService;
    modelMetricsService;
    constructor(transactionRepository, fraudScoringService, eventBusService, autonomousResponseService, deviceFingerprintService, fraudExplanationService, geoService, auditService, modelMetricsService) {
        this.transactionRepository = transactionRepository;
        this.fraudScoringService = fraudScoringService;
        this.eventBusService = eventBusService;
        this.autonomousResponseService = autonomousResponseService;
        this.deviceFingerprintService = deviceFingerprintService;
        this.fraudExplanationService = fraudExplanationService;
        this.geoService = geoService;
        this.auditService = auditService;
        this.modelMetricsService = modelMetricsService;
    }
    async create(input) {
        const scoring = await this.fraudScoringService.score(input);
        const transaction = await this.transactionRepository.create({
            transactionId: (0, uuid_1.v4)(),
            ...input,
            fraudScore: scoring.fraudScore,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await this.autonomousResponseService.process({
            transactionId: transaction.transactionId,
            userId: transaction.userId,
            fraudScore: transaction.fraudScore,
            location: transaction.location,
            ruleReasons: scoring.ruleReasons ?? [],
            explanations: scoring.explanations ?? []
        });
        return transaction;
    }
    async list(limit = 50) {
        return this.transactionRepository.findRecent(limit);
    }
    async query(query) {
        return this.transactionRepository.query(query);
    }
    async findByTransactionId(transactionId) {
        return this.transactionRepository.findByTransactionId(transactionId);
    }
    async stats() {
        return this.transactionRepository.stats();
    }
}
exports.TransactionService = TransactionService;
