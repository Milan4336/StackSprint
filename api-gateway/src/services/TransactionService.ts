import { v4 as uuidv4 } from 'uuid';
import { AutonomousResponseService } from './AutonomousResponseService';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { TransactionQueryOptions } from '../repositories/TransactionRepository';

export interface CreateTransactionInput {
  userId: string;
  amount: number;
  location: string;
  deviceId: string;
  ipAddress: string;
  currency: string;
  transactionId?: string;
  timestamp?: Date;
}


export class TransactionService {

  constructor(
    private readonly transactionRepository: any,
    private readonly fraudScoringService: any,
    private readonly eventBusService: any,
    private readonly autonomousResponseService: AutonomousResponseService,
    private readonly deviceFingerprintService: any,
    private readonly fraudExplanationService: any,
    private readonly geoService: any,
    private readonly auditService: any,
    private readonly modelMetricsService: any
  ) { }

  async create(input: CreateTransactionInput) {

    const scoring = await this.fraudScoringService.score(input);

    const transaction = await this.transactionRepository.create({
      transactionId: input.transactionId ?? uuidv4(),
      ...input,
      // Full scoring result — all fields required by the Mongoose schema
      fraudScore: scoring.fraudScore,
      riskLevel: scoring.riskLevel,
      isFraud: scoring.isFraud,
      action: scoring.action,
      ruleScore: scoring.ruleScore,
      mlScore: scoring.mlScore,
      mlStatus: scoring.mlStatus,
      modelName: scoring.modelName,
      modelVersion: scoring.modelVersion,
      modelConfidence: scoring.modelConfidence,
      geoVelocityFlag: scoring.geoVelocityFlag,
      explanations: scoring.explanations ?? [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.autonomousResponseService.process({
      transactionId: transaction.transactionId,
      userId: transaction.userId,
      fraudScore: transaction.fraudScore,
      location: transaction.location,
      ruleReasons: scoring.ruleReasons ?? [],
      explanations: scoring.explanations ?? []
    });

    return transaction;
  }

  async list(limit = 50) {
    return this.transactionRepository.findRecent(limit);
  }

  async query(query: TransactionQueryOptions) {
    return this.transactionRepository.query(query);
  }

  async findByTransactionId(transactionId: string) {
    return this.transactionRepository.findByTransactionId(transactionId);
  }

  async stats() {
    return this.transactionRepository.stats();
  }
}
