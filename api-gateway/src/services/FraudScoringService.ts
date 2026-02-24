import { env } from '../config/env';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { RuleEngineService } from './RuleEngineService';
import { MlServiceClient } from './MlServiceClient';
import { SettingsService } from './SettingsService';

export class FraudScoringService {
  constructor(
    private readonly ruleEngineService: RuleEngineService,
    private readonly mlServiceClient: MlServiceClient,
    private readonly settingsService: SettingsService
  ) {}

  private classify(score: number): 'Low' | 'Medium' | 'High' {
    if (score <= 30) return 'Low';
    if (score <= 70) return 'Medium';
    return 'High';
  }

  private responseAction(score: number): 'ALLOW' | 'STEP_UP_AUTH' | 'BLOCK' {
    if (score >= 71) return 'BLOCK';
    if (score >= 31) return 'STEP_UP_AUTH';
    return 'ALLOW';
  }

  async score(input: {
    userId: string;
    amount: number;
    location: string;
    deviceId: string;
    ipAddress: string;
    latitude?: number;
    longitude?: number;
    timestamp: Date;
  }): Promise<{
    fraudScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    isFraud: boolean;
    action: 'ALLOW' | 'STEP_UP_AUTH' | 'BLOCK';
    ruleScore: number;
    mlScore: number;
    mlStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
    modelVersion: string;
    modelName: string;
    modelConfidence: number;
    explanations: FraudExplanationItem[];
    ruleReasons: string[];
    geoVelocityFlag: boolean;
  }> {
    const ruleEvaluation = await this.ruleEngineService.evaluate(input);
    const runtimeConfig = await this.settingsService.getRuntimeConfig();
    const ruleScore = ruleEvaluation.score;

    let mlScore = 0;
    let explanations: FraudExplanationItem[] = [];
    let mlStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' = this.mlServiceClient.getStatus().status;
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
    } catch {
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
      modelVersion: env.MODEL_VERSION,
      modelName: env.MODEL_NAME,
      modelConfidence,
      explanations,
      ruleReasons: ruleEvaluation.reasons,
      geoVelocityFlag: ruleEvaluation.geoVelocityFlag
    };
  }
}
