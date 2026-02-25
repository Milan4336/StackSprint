"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
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
        const resolvedGeo = await this.geoService.resolveCoordinates(input.ipAddress, input.location);
        const scoring = await this.fraudScoringService.score({
            userId: input.userId,
            amount: input.amount,
            location: input.location,
            deviceId: input.deviceId,
            ipAddress: input.ipAddress,
            latitude: resolvedGeo.latitude,
            longitude: resolvedGeo.longitude,
            timestamp: input.timestamp
        });
        const created = await this.transactionRepository.create({
            ...input,
            latitude: resolvedGeo.latitude,
            longitude: resolvedGeo.longitude,
            city: resolvedGeo.city,
            country: resolvedGeo.country,
            action: scoring.action,
            ruleScore: scoring.ruleScore,
            mlScore: scoring.mlScore,
            mlStatus: scoring.mlStatus,
            modelVersion: scoring.modelVersion,
            modelName: scoring.modelName,
            modelConfidence: scoring.modelConfidence,
            fraudScore: scoring.fraudScore,
            riskLevel: scoring.riskLevel,
            isFraud: scoring.isFraud,
            geoVelocityFlag: scoring.geoVelocityFlag,
            explanations: scoring.explanations
        });
        await Promise.all([
            this.fraudExplanationService.save({
                transactionId: created.transactionId,
                userId: created.userId,
                fraudScore: created.fraudScore,
                explanations: scoring.explanations
            }),
            this.deviceFingerprintService.track({
                userId: created.userId,
                deviceId: created.deviceId,
                location: created.location,
                riskLevel: created.riskLevel,
                fraudScore: created.fraudScore,
                timestamp: created.timestamp
            }),
            this.autonomousResponseService.process({
                transactionId: created.transactionId,
                userId: created.userId,
                fraudScore: created.fraudScore,
                riskLevel: created.riskLevel,
                ruleReasons: scoring.ruleReasons,
                explanations: scoring.explanations
            }),
            this.auditService.log({
                eventType: 'TRANSACTION_SCORED',
                action: 'score',
                entityType: 'transaction',
                entityId: created.transactionId,
                metadata: {
                    userId: created.userId,
                    action: created.action,
                    ruleScore: created.ruleScore,
                    mlScore: created.mlScore,
                    fraudScore: created.fraudScore,
                    riskLevel: created.riskLevel
                }
            })
        ]);
        await this.eventBusService.publishTransactionCreated({
            transactionId: created.transactionId,
            amount: created.amount,
            location: created.location,
            latitude: created.latitude,
            longitude: created.longitude,
            city: created.city,
            country: created.country,
            riskLevel: created.riskLevel,
            action: created.action,
            ruleScore: created.ruleScore,
            mlScore: created.mlScore,
            mlStatus: created.mlStatus,
            modelVersion: created.modelVersion,
            modelName: created.modelName,
            modelConfidence: created.modelConfidence,
            fraudScore: created.fraudScore,
            timestamp: created.timestamp,
            isFraud: created.isFraud,
            geoVelocityFlag: created.geoVelocityFlag,
            userId: created.userId,
            deviceId: created.deviceId,
            explanations: created.explanations
        });
        await this.modelMetricsService.recordSnapshotIfDue();
        return created;
    }
    async list(limit = 100) {
        return this.transactionRepository.findRecent(limit);
    }
    async query(input) {
        return this.transactionRepository.query(input);
    }
    async findByTransactionId(transactionId) {
        return this.transactionRepository.findByTransactionId(transactionId);
    }
    async stats() {
        const [summary, highRiskUsers, fraudByCountry] = await Promise.all([
            this.transactionRepository.getStats(),
            this.transactionRepository.topHighRiskUsers(5),
            this.transactionRepository.fraudByCountry(10)
        ]);
        return {
            totalTransactions: summary.total,
            fraudTransactions: summary.fraudCount,
            fraudRate: summary.total ? summary.fraudCount / summary.total : 0,
            avgRiskScore: summary.avgScore,
            highRiskUsers,
            fraudByCountry
        };
    }
}
exports.TransactionService = TransactionService;
