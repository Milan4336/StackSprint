import { env } from '../config/env';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { RuleEngineService } from './RuleEngineService';
import { MlServiceClient } from './MlServiceClient';
import { geminiService } from './GeminiService';
import { SettingsService } from './SettingsService';
import { MuleDetectionService } from './MuleDetectionService';

export class FraudScoringService {
  constructor(
    private readonly ruleEngineService: RuleEngineService,
    private readonly mlServiceClient: MlServiceClient,
    private readonly settingsService: SettingsService,
    private readonly userBehaviorService: any,
    private readonly fraudGraphService: any,
    private readonly muleDetectionService: MuleDetectionService
  ) { }

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

  private buildDeterministicNarrative(input: {
    amount: number;
    location: string;
    deviceLabel?: string;
  }, scores: {
    fraudScore: number;
    ruleScore: number;
    mlScore: number;
    behaviorScore: number;
    graphScore: number;
    modelConfidence: number;
  }, reasons: string[]): string {
    const primaryReason = reasons[0] ?? 'Composite anomaly indicators triggered the risk policy.';
    const deviceSignal = input.deviceLabel ? `Device signal: ${input.deviceLabel}.` : '';
    return [
      `Risk ${scores.fraudScore}/100 driven by rule pressure ${scores.ruleScore.toFixed(1)}, ML ${Math.round(scores.mlScore * 100)}%, behavior ${Math.round(scores.behaviorScore * 100)}%, graph ${Math.round(scores.graphScore * 100)}%.`,
      `Primary trigger: ${primaryReason}`,
      `Model confidence ${Math.round(scores.modelConfidence * 100)}%.`,
      `Transaction context: amount ${input.amount} at ${input.location}.`,
      deviceSignal
    ]
      .filter(Boolean)
      .join(' ');
  }

  private async buildNarrative(input: {
    amount: number;
    location: string;
    deviceLabel?: string;
  }, scores: {
    fraudScore: number;
    ruleScore: number;
    mlScore: number;
    behaviorScore: number;
    graphScore: number;
    modelConfidence: number;
  }, reasons: string[]): Promise<string | undefined> {
    if (scores.fraudScore < 40) {
      return undefined;
    }

    const deterministic = this.buildDeterministicNarrative(input, scores, reasons);

    if (!geminiService.isConfigured()) {
      return deterministic;
    }

    const xaiPrompt = `Rewrite this fraud narrative in one concise sentence for an analyst and keep every concrete signal.
    Narrative: ${deterministic}
    Rule Reasons: ${reasons.join(', ') || 'None provided'}`;

    try {
      const generated = await geminiService.generateResponse(xaiPrompt);
      return generated || deterministic;
    } catch {
      return deterministic;
    }
  }

  async score(input: {
    userId: string;
    amount: number;
    location: string;
    deviceId: string;
    ipAddress: string;
    deviceLabel?: string;
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
    modelScores?: Record<string, number>;
    modelWeights?: Record<string, number>;
    behaviorScore: number;
    graphScore: number;
    explanations: FraudExplanationItem[];
    ruleReasons: string[];
    geoVelocityFlag: boolean;
    verificationStatus: 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED';
    aiExplanation?: string;
  }> {
    const ruleEvaluation = await this.ruleEngineService.evaluate(input);
    const runtimeConfig = await this.settingsService.getRuntimeConfig();
    const ruleScore = ruleEvaluation.score;

    let mlScore = 0;
    let mlConfidence = 0;
    let mlModelScores = {};
    let mlWeights = {};
    let explanations: FraudExplanationItem[] = [];
    let mlStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' = this.mlServiceClient.getStatus().status;

    try {
      const mlResult = await this.mlServiceClient.score({
        userId: input.userId,
        amount: input.amount,
        location: input.location,
        deviceId: input.deviceId,
        timestamp: input.timestamp.toISOString()
      });

      mlScore = mlResult.fraudScore;
      mlConfidence = mlResult.confidence ?? 0;
      mlModelScores = mlResult.modelScores ?? {};
      mlWeights = mlResult.modelWeights ?? {};
      explanations = mlResult.explanations ?? [];
      mlStatus = this.mlServiceClient.getStatus().status;

      // Fallback: If ML failed or returned no explanations, build them from rules
      if (explanations.length === 0) {
        explanations = ruleEvaluation.reasons.map(reason => ({
          feature: reason.split(':')[0] || 'Behavioral',
          impact: 0.25,
          reason: reason
        }));
      }

      const [behaviorScore, graphScore, muleResult] = await Promise.all([
        this.userBehaviorService.updateProfileAndGetDeviation(input).catch(() => 0),
        this.fraudGraphService.updateGraphAndGetAnomaly(input).catch(() => 0),
        this.muleDetectionService.detectMule(input.userId).catch(() => ({ isMule: false, confidence: 0, reason: '' }))
      ]);

      // BANK-GRADE WEIGHTED FUSION (Using Configurable Weights)
      let combinedScore = (
        (ruleScore * runtimeConfig.scoreRuleWeight) +
        (mlScore * 100 * runtimeConfig.scoreMlWeight) +
        (behaviorScore * 100 * runtimeConfig.scoreBehaviorWeight) +
        (graphScore * 100 * runtimeConfig.scoreGraphWeight)
      );

      // Add Mule Anomaly Penalty
      if (muleResult.isMule) {
        combinedScore = Math.min(100, combinedScore + (muleResult.confidence * 40));
        ruleEvaluation.reasons.push(`Mule Account Indicator: ${muleResult.reason}`);
        explanations.push({
          feature: 'Network Graph',
          impact: muleResult.confidence,
          reason: muleResult.reason || 'Siphon pattern detected'
        });
      }

      // Device Intelligence Context Modifier
      if (input.deviceLabel === 'New Device' && input.amount > 1000) {
        combinedScore = Math.min(100, combinedScore + 20); // Spike probability threshold
        ruleEvaluation.reasons.push('High-value transaction originating from an untrusted New Device');
      }

      const finalFraudScore = Math.round(combinedScore);

      const aiExplanation = await this.buildNarrative(
        { amount: input.amount, location: input.location, deviceLabel: input.deviceLabel },
        {
          fraudScore: finalFraudScore,
          ruleScore,
          mlScore,
          behaviorScore,
          graphScore,
          modelConfidence: mlConfidence
        },
        ruleEvaluation.reasons
      );

      let action = this.responseAction(finalFraudScore);
      let verificationStatus: 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED' = 'NOT_REQUIRED';

      // Zero Trust Trigger condition
      if (
        finalFraudScore > 70 &&
        input.amount > runtimeConfig.highAmountThreshold &&
        input.deviceLabel === 'New Device'
      ) {
        action = 'STEP_UP_AUTH';
        verificationStatus = 'PENDING';
        ruleEvaluation.reasons.push('Zero Trust Triggered: High score + new device + high amount.');
      } else if (action === 'BLOCK') {
        verificationStatus = 'FAILED';
      } else if (action === 'STEP_UP_AUTH') {
        verificationStatus = 'PENDING';
      }

      return {
        fraudScore: finalFraudScore,
        riskLevel: this.classify(finalFraudScore),
        isFraud: finalFraudScore >= 70,
        action,
        verificationStatus,
        ruleScore,
        mlScore,
        behaviorScore,
        graphScore,
        mlStatus,
        modelVersion: env.MODEL_VERSION,
        modelName: env.MODEL_NAME,
        modelConfidence: mlConfidence,
        modelScores: mlModelScores,
        modelWeights: mlWeights,
        explanations,
        ruleReasons: ruleEvaluation.reasons,
        geoVelocityFlag: ruleEvaluation.geoVelocityFlag,
        aiExplanation
      };
    } catch (error) {
      mlStatus = this.mlServiceClient.getStatus().status;
      const [behaviorScore, graphScore] = await Promise.all([
        this.userBehaviorService.updateProfileAndGetDeviation(input).catch(() => 0),
        this.fraudGraphService.updateGraphAndGetAnomaly(input).catch(() => 0)
      ]);

      const sumOthers = runtimeConfig.scoreRuleWeight + runtimeConfig.scoreBehaviorWeight + runtimeConfig.scoreGraphWeight;
      const fallbackRuleWeight = runtimeConfig.scoreRuleWeight / sumOthers;
      const fallbackBehaviorWeight = runtimeConfig.scoreBehaviorWeight / sumOthers;
      const fallbackGraphWeight = runtimeConfig.scoreGraphWeight / sumOthers;

      const fallbackScore = Math.round(
        (ruleScore * fallbackRuleWeight) +
        (behaviorScore * 100 * fallbackBehaviorWeight) +
        (graphScore * 100 * fallbackGraphWeight)
      );

      let action = this.responseAction(fallbackScore);
      let verificationStatus: 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED' = 'NOT_REQUIRED';

      if (
        fallbackScore > 70 &&
        input.amount > runtimeConfig.highAmountThreshold &&
        input.deviceLabel === 'New Device'
      ) {
        action = 'STEP_UP_AUTH';
        verificationStatus = 'PENDING';
        ruleEvaluation.reasons.push('Zero Trust Triggered: High score + new device + high amount (ML Offline).');
      } else if (action === 'BLOCK') {
        verificationStatus = 'FAILED';
      } else if (action === 'STEP_UP_AUTH') {
        verificationStatus = 'PENDING';
      }

      const aiExplanation = await this.buildNarrative(
        { amount: input.amount, location: input.location, deviceLabel: input.deviceLabel },
        {
          fraudScore: fallbackScore,
          ruleScore,
          mlScore: 0,
          behaviorScore,
          graphScore,
          modelConfidence: 0
        },
        ruleEvaluation.reasons
      );

      const fallbackExplanations = ruleEvaluation.reasons.map(reason => ({
        feature: reason.split(':')[0] || 'Behavioral',
        impact: 0.3,
        reason: reason
      }));

      return {
        fraudScore: fallbackScore,
        riskLevel: this.classify(fallbackScore),
        isFraud: fallbackScore >= 70,
        action,
        verificationStatus,
        ruleScore,
        mlScore: 0,
        behaviorScore,
        graphScore,
        mlStatus,
        modelVersion: env.MODEL_VERSION,
        modelName: env.MODEL_NAME,
        modelConfidence: 0,
        modelScores: {},
        modelWeights: {},
        explanations: fallbackExplanations,
        ruleReasons: ruleEvaluation.reasons,
        geoVelocityFlag: ruleEvaluation.geoVelocityFlag,
        aiExplanation
      };
    }
  }
}
