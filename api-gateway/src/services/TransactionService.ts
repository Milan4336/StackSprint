import { TransactionRepository } from '../repositories/TransactionRepository';
import { FraudScoringService } from './FraudScoringService';
import { EventBusService } from './EventBusService';
import { AutonomousResponseService } from './AutonomousResponseService';
import { DeviceFingerprintService } from './DeviceFingerprintService';
import { FraudExplanationService } from './FraudExplanationService';
import { GeoService } from './GeoService';
import { AuditService } from './AuditService';
import { ModelMetricsService } from './ModelMetricsService';

export interface CreateTransactionInput {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  location: string;
  deviceId: string;
  ipAddress: string;
  timestamp: Date;
}

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly fraudScoringService: FraudScoringService,
    private readonly eventBusService: EventBusService,
    private readonly autonomousResponseService: AutonomousResponseService,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly fraudExplanationService: FraudExplanationService,
    private readonly geoService: GeoService,
    private readonly auditService: AuditService,
    private readonly modelMetricsService: ModelMetricsService
  ) {}

  async create(input: CreateTransactionInput) {
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

  async query(input: {
    page: number;
    limit: number;
    search?: string;
    riskLevel?: 'Low' | 'Medium' | 'High';
    userId?: string;
    deviceId?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: Date;
    endDate?: Date;
    sortBy?: 'timestamp' | 'amount' | 'fraudScore' | 'riskLevel' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.transactionRepository.query(input);
  }

  async findByTransactionId(transactionId: string) {
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
