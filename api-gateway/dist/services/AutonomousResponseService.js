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
        lines.push(`Autonomous response triggered at score ${input.fraudScore} (threshold ${input.threshold}).`);
        (input.ruleReasons ?? []).forEach((reason, index) => {
            lines.push(`${index + 1}. Rule: ${reason}`);
        });
        (input.explanations ?? []).forEach((exp, index) => {
            lines.push(`${index + 1 + (input.ruleReasons?.length ?? 0)}. ML(${exp.feature}): ${exp.reason}`);
        });
        return lines.join('\n');
    }
    async process(input) {
        const threshold = this.fallbackThreshold;
        if (input.fraudScore < threshold) {
            return null;
        }
        const reason = this.composeReason({
            fraudScore: input.fraudScore,
            threshold,
            ruleReasons: input.ruleReasons,
            explanations: input.explanations
        });
        const alert = await this.fraudAlertRepository.create({
            alertId: (0, uuid_1.v4)(),
            transactionId: input.transactionId,
            userId: input.userId,
            fraudScore: input.fraudScore,
            riskLevel: 'High',
            reason,
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await this.eventBusService.publishFraudAlert(alert);
        await this.auditService.log({
            eventType: 'fraud.alert.created',
            action: 'create',
            entityType: 'fraudAlert',
            entityId: alert.alertId,
            metadata: {
                userId: input.userId,
                fraudScore: input.fraudScore
            }
        });
        return alert;
    }
}
exports.AutonomousResponseService = AutonomousResponseService;
