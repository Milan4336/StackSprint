import { v4 as uuidv4 } from 'uuid';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { EventBusService } from './EventBusService';
import { SettingsService } from './SettingsService';
import { AuditService } from './AuditService';

export interface AutonomousResponseInput {
  transactionId: string;
  userId: string;
  fraudScore: number;
  location?: string;
  ruleReasons?: string[];
  explanations?: FraudExplanationItem[];
}

export class AutonomousResponseService {
  constructor(
    private readonly fraudAlertRepository: FraudAlertRepository,
    private readonly eventBusService: EventBusService,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
    private readonly fallbackThreshold = 80
  ) {}

  private composeReason(input: {
    fraudScore: number;
    threshold: number;
    ruleReasons?: string[];
    explanations?: FraudExplanationItem[];
  }): string {
    const lines: string[] = [];

    lines.push(
      `Autonomous response triggered at score ${input.fraudScore} (threshold ${input.threshold}).`
    );

    (input.ruleReasons ?? []).forEach((reason, index) => {
      lines.push(`${index + 1}. Rule: ${reason}`);
    });

    (input.explanations ?? []).forEach((exp, index) => {
      lines.push(
        `${index + 1 + (input.ruleReasons?.length ?? 0)}. ML(${exp.feature}): ${exp.reason}`
      );
    });

    return lines.join('\n');
  }

  async process(input: AutonomousResponseInput) {
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
      alertId: uuidv4(),
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
