"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutonomousResponseService = void 0;
const uuid_1 = require("uuid");
class AutonomousResponseService {
    fraudAlertRepository;
    eventBusService;
    settingsService;
    auditService;
    fallbackThreshold;
    constructor(fraudAlertRepository, eventBusService, settingsService, auditService, fallbackThreshold = 80) {
        this.fraudAlertRepository = fraudAlertRepository;
        this.eventBusService = eventBusService;
        this.settingsService = settingsService;
        this.auditService = auditService;
        this.fallbackThreshold = fallbackThreshold;
    }
    composeReason(input) {
        const lines = [];
        for (const reason of input.ruleReasons ?? []) {
            lines.push(`Rule: ${reason}`);
        }
        for (const item of input.explanations ?? []) {
            lines.push(`ML(${item.feature}): ${item.reason}`);
        }
        if (lines.length === 0) {
            lines.push('No explicit signals available; high aggregate risk score triggered autonomous response.');
        }
        const deDuplicated = Array.from(new Set(lines));
        const detail = deDuplicated.map((line, index) => `${index + 1}. ${line}`).join('\n');
        return `Autonomous response triggered at score ${input.fraudScore} (threshold ${input.threshold}).\n${detail}`;
    }
    async process(input) {
        const runtime = await this.settingsService.getRuntimeConfig().catch(() => null);
        const threshold = runtime?.autonomousAlertThreshold ?? this.fallbackThreshold;
        if (input.fraudScore < threshold) {
            return;
        }
        const reason = this.composeReason({ ...input, threshold });
        const alert = await this.fraudAlertRepository.create({
            alertId: (0, uuid_1.v4)(),
            transactionId: input.transactionId,
            userId: input.userId,
            fraudScore: input.fraudScore,
            riskLevel: input.riskLevel,
            reason,
            status: 'open'
        });
        await this.auditService.log({
            eventType: 'ALERT_GENERATED',
            action: 'create',
            entityType: 'fraud_alert',
            entityId: alert.alertId,
            metadata: {
                transactionId: alert.transactionId,
                userId: alert.userId,
                fraudScore: alert.fraudScore,
                riskLevel: alert.riskLevel
            }
        });
        await this.eventBusService.publishFraudAlert({
            alertId: alert.alertId,
            transactionId: alert.transactionId,
            userId: alert.userId,
            fraudScore: alert.fraudScore,
            riskLevel: alert.riskLevel,
            reason: alert.reason,
            status: alert.status,
            createdAt: alert.createdAt
        });
    }
}
exports.AutonomousResponseService = AutonomousResponseService;
