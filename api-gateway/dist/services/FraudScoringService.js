"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudScoringService = void 0;
const env_1 = require("../config/env");
class FraudScoringService {
    ruleEngineService;
    mlServiceClient;
    settingsService;
    constructor(ruleEngineService, mlServiceClient, settingsService) {
        this.ruleEngineService = ruleEngineService;
        this.mlServiceClient = mlServiceClient;
        this.settingsService = settingsService;
    }
    classify(score) {
        if (score <= 30)
            return 'Low';
        if (score <= 70)
            return 'Medium';
        return 'High';
    }
    responseAction(score) {
        if (score >= 71)
            return 'BLOCK';
        if (score >= 31)
            return 'STEP_UP_AUTH';
        return 'ALLOW';
    }
    async score(input) {
        const ruleEvaluation = await this.ruleEngineService.evaluate(input);
        const runtimeConfig = await this.settingsService.getRuntimeConfig();
        const ruleScore = ruleEvaluation.score;
        let mlScore = 0;
        let explanations = [];
        let mlStatus = this.mlServiceClient.getStatus().status;
        let useRuleFallbackOnly = false;
        try {
            const mlResult = await this.mlServiceClient.score({
                userId: input.userId,
                amount: input.amount,
                location: input.location,
                deviceId: input.deviceId,
                timestamp: input.timestamp.toISOString()
            });
            mlScore = mlResult.fraudScore;
            explanations = mlResult.explanations ?? [];
            mlStatus = this.mlServiceClient.getStatus().status;
        }
        catch {
            mlScore = 0;
            explanations = [];
            useRuleFallbackOnly = true;
            mlStatus = this.mlServiceClient.getStatus().status;
        }
        const weighted = useRuleFallbackOnly
            ? ruleScore
            : ruleScore * runtimeConfig.scoreRuleWeight + mlScore * 100 * runtimeConfig.scoreMlWeight;
        const fraudScore = Math.max(0, Math.min(100, Math.round(weighted)));
        const riskLevel = this.classify(fraudScore);
        const action = this.responseAction(fraudScore);
        const modelConfidence = Math.max(0, Math.min(1, useRuleFallbackOnly ? ruleScore / 100 : mlScore));
        return {
            fraudScore,
            riskLevel,
            isFraud: riskLevel === 'High',
            action,
            ruleScore,
            mlScore,
            mlStatus,
            modelVersion: env_1.env.MODEL_VERSION,
            modelName: env_1.env.MODEL_NAME,
            modelConfidence,
            explanations,
            ruleReasons: ruleEvaluation.reasons,
            geoVelocityFlag: ruleEvaluation.geoVelocityFlag
        };
    }
}
exports.FraudScoringService = FraudScoringService;
