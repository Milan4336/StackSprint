"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const errors_1 = require("../utils/errors");
class SettingsService {
    settingsRepository;
    auditService;
    constructor(settingsRepository, auditService) {
        this.settingsRepository = settingsRepository;
        this.auditService = auditService;
    }
    async get() {
        return this.settingsRepository.getOrCreate();
    }
    async getRuntimeConfig() {
        const setting = await this.settingsRepository.getOrCreate();
        return {
            highAmountThreshold: setting.highAmountThreshold,
            velocityWindowMinutes: setting.velocityWindowMinutes,
            velocityTxThreshold: setting.velocityTxThreshold,
            scoreRuleWeight: setting.scoreRuleWeight,
            scoreMlWeight: setting.scoreMlWeight,
            scoreBehaviorWeight: setting.scoreBehaviorWeight,
            scoreGraphWeight: setting.scoreGraphWeight,
            autonomousAlertThreshold: setting.autonomousAlertThreshold,
            simulationMode: setting.simulationMode,
            safeMode: setting.safeMode
        };
    }
    async update(input, actor) {
        const current = await this.settingsRepository.getOrCreate();
        const nextRuleWeight = input.scoreRuleWeight ?? current.scoreRuleWeight;
        const nextMlWeight = input.scoreMlWeight ?? current.scoreMlWeight;
        const nextBehaviorWeight = input.scoreBehaviorWeight ?? current.scoreBehaviorWeight;
        const nextGraphWeight = input.scoreGraphWeight ?? current.scoreGraphWeight;
        if (Math.abs(nextRuleWeight + nextMlWeight + nextBehaviorWeight + nextGraphWeight - 1) > 0.001) {
            throw new errors_1.AppError('Weights (Rule + ML + Behavior + Graph) must equal 1', 400);
        }
        const updated = await this.settingsRepository.update({
            ...(input.highAmountThreshold !== undefined ? { highAmountThreshold: input.highAmountThreshold } : {}),
            ...(input.velocityWindowMinutes !== undefined ? { velocityWindowMinutes: input.velocityWindowMinutes } : {}),
            ...(input.velocityTxThreshold !== undefined ? { velocityTxThreshold: input.velocityTxThreshold } : {}),
            ...(input.scoreRuleWeight !== undefined ? { scoreRuleWeight: input.scoreRuleWeight } : {}),
            ...(input.scoreMlWeight !== undefined ? { scoreMlWeight: input.scoreMlWeight } : {}),
            ...(input.scoreBehaviorWeight !== undefined ? { scoreBehaviorWeight: input.scoreBehaviorWeight } : {}),
            ...(input.scoreGraphWeight !== undefined ? { scoreGraphWeight: input.scoreGraphWeight } : {}),
            ...(input.autonomousAlertThreshold !== undefined
                ? { autonomousAlertThreshold: input.autonomousAlertThreshold }
                : {}),
            ...(input.simulationMode !== undefined ? { simulationMode: input.simulationMode } : {}),
            ...(input.safeMode !== undefined ? { safeMode: input.safeMode } : {}),
            ...(actor?.actorEmail ? { updatedBy: actor.actorEmail } : {})
        });
        await this.auditService.log({
            eventType: 'SETTINGS_UPDATED',
            action: 'update',
            entityType: 'settings',
            entityId: updated.key,
            actor,
            metadata: input
        });
        return updated;
    }
}
exports.SettingsService = SettingsService;
