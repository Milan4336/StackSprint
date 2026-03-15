import { beforeAll, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/fraud-test';
process.env.REDIS_URI = process.env.REDIS_URI ?? 'redis://localhost:6379';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'this-is-a-test-jwt-secret-at-least-32-chars';
process.env.ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173';

let FraudScoringServiceClass: typeof import('./FraudScoringService').FraudScoringService;

vi.mock('./GeminiService', () => ({
  geminiService: {
    isConfigured: () => false,
    generateResponse: vi.fn().mockResolvedValue(''),
    embedText: vi.fn().mockResolvedValue(null)
  }
}));

beforeAll(async () => {
  const module = await import('./FraudScoringService');
  FraudScoringServiceClass = module.FraudScoringService;
});

interface ScoreFixture {
  ruleScore: number;
  mlScore: number;
  behaviorScore: number;
  graphScore: number;
  mlThrows?: boolean;
}

const createService = (fixture: ScoreFixture) => {
  const ruleEngineService = {
    evaluate: vi.fn().mockResolvedValue({
      score: fixture.ruleScore,
      reasons: ['Velocity spike detected'],
      geoVelocityFlag: true
    })
  };

  const mlServiceClient = {
    score: fixture.mlThrows
      ? vi.fn().mockRejectedValue(new Error('ML unavailable'))
      : vi.fn().mockResolvedValue({
          fraudScore: fixture.mlScore,
          confidence: 0.86,
          modelScores: { iso_forest: fixture.mlScore },
          modelWeights: { iso_forest: 1 },
          explanations: [{ feature: 'velocity', impact: 0.72, reason: 'Burst in transaction volume' }]
        }),
    getStatus: vi.fn().mockReturnValue({ status: fixture.mlThrows ? 'OFFLINE' : 'HEALTHY' })
  };

  const settingsService = {
    getRuntimeConfig: vi.fn().mockResolvedValue({
      highAmountThreshold: 5000,
      scoreRuleWeight: 0.2,
      scoreMlWeight: 0.4,
      scoreBehaviorWeight: 0.25,
      scoreGraphWeight: 0.15
    })
  };

  const userBehaviorService = {
    updateProfileAndGetDeviation: vi.fn().mockResolvedValue(fixture.behaviorScore)
  };

  const fraudGraphService = {
    updateGraphAndGetAnomaly: vi.fn().mockResolvedValue(fixture.graphScore)
  };

  return new FraudScoringServiceClass(
    ruleEngineService as any,
    mlServiceClient as any,
    settingsService as any,
    userBehaviorService as any,
    fraudGraphService as any
  );
};

describe('FraudScoringService', () => {
  it('produces a BLOCK decision for high composite risk', async () => {
    const service = createService({
      ruleScore: 70,
      mlScore: 0.9,
      behaviorScore: 0.8,
      graphScore: 0.7
    });

    const result = await service.score({
      userId: 'user-1',
      amount: 1200,
      location: 'Mumbai',
      deviceId: 'device-1',
      ipAddress: '1.2.3.4',
      deviceLabel: 'Trusted Device',
      timestamp: new Date('2026-03-10T00:00:00.000Z')
    });

    expect(result.fraudScore).toBeGreaterThanOrEqual(71);
    expect(result.action).toBe('BLOCK');
    expect(result.verificationStatus).toBe('FAILED');
    expect(result.riskLevel).toBe('High');
    expect(result.ruleReasons).toContain('Velocity spike detected');
  });

  it('falls back when ML is offline and enforces step-up for high-risk new-device payments', async () => {
    const service = createService({
      ruleScore: 80,
      mlScore: 0,
      behaviorScore: 0.9,
      graphScore: 0.8,
      mlThrows: true
    });

    const result = await service.score({
      userId: 'user-2',
      amount: 12000,
      location: 'Delhi',
      deviceId: 'device-9',
      ipAddress: '5.6.7.8',
      deviceLabel: 'New Device',
      timestamp: new Date('2026-03-10T00:00:00.000Z')
    });

    expect(result.mlStatus).toBe('OFFLINE');
    expect(result.mlScore).toBe(0);
    expect(result.action).toBe('STEP_UP_AUTH');
    expect(result.verificationStatus).toBe('PENDING');
    expect(result.fraudScore).toBeGreaterThan(70);
  });
});
