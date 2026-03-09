"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const uuid_1 = require("uuid");
class TransactionService {
    transactionRepository;
    fraudScoringService;
    eventBusService;
    fraudResponseService;
    deviceFingerprintService;
    fraudExplanationService;
    geoService;
    auditService;
    modelMetricsService;
    constructor(transactionRepository, fraudScoringService, eventBusService, fraudResponseService, deviceFingerprintService, fraudExplanationService, geoService, auditService, modelMetricsService) {
        this.transactionRepository = transactionRepository;
        this.fraudScoringService = fraudScoringService;
        this.eventBusService = eventBusService;
        this.fraudResponseService = fraudResponseService;
        this.deviceFingerprintService = deviceFingerprintService;
        this.fraudExplanationService = fraudExplanationService;
        this.geoService = geoService;
        this.auditService = auditService;
        this.modelMetricsService = modelMetricsService;
    }
    async create(input) {
        const enrichedInput = {
            ...input,
            timestamp: input.timestamp || new Date()
        };
        const scoring = await this.fraudScoringService.score(enrichedInput);
        const transaction = await this.transactionRepository.create({
            transactionId: input.transactionId ?? (0, uuid_1.v4)(),
            ...enrichedInput,
            // Full scoring result — all fields required by the Mongoose schema
            fraudScore: scoring.fraudScore,
            riskLevel: scoring.riskLevel,
            isFraud: scoring.isFraud,
            action: scoring.action,
            ruleScore: scoring.ruleScore,
            mlScore: scoring.mlScore,
            mlStatus: scoring.mlStatus,
            behaviorScore: scoring.behaviorScore,
            graphScore: scoring.graphScore,
            modelName: scoring.modelName,
            modelVersion: scoring.modelVersion,
            modelConfidence: scoring.modelConfidence,
            modelScores: scoring.modelScores,
            modelWeights: scoring.modelWeights,
            geoVelocityFlag: scoring.geoVelocityFlag,
            ruleReasons: scoring.ruleReasons ?? [],
            explanations: scoring.explanations ?? [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await this.fraudResponseService.process({
            transactionId: transaction.transactionId,
            userId: transaction.userId,
            fraudScore: transaction.fraudScore,
            deviceId: transaction.deviceId,
            ipAddress: transaction.ipAddress,
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
