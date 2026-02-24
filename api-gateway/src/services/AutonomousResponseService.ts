import { v4 as uuidv4 } from 'uuid';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { EventBusService } from './EventBusService';

export class AutonomousResponseService {
  constructor(
    private readonly fraudAlertRepository: FraudAlertRepository,
    private readonly eventBusService: EventBusService,
    private readonly threshold = 80
  ) {}

  private composeReason(input: {
    fraudScore: number;
    ruleReasons?: string[];
    explanations?: FraudExplanationItem[];
  }): string {
    const lines: string[] = [];

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
    return `Autonomous response triggered at score ${input.fraudScore} (threshold ${this.threshold}).\n${detail}`;
  }

  async process(input: {
    transactionId: string;
    userId: string;
    fraudScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    ruleReasons?: string[];
    explanations?: FraudExplanationItem[];
  }): Promise<void> {
    if (input.fraudScore < this.threshold) {
      return;
    }

    const reason = this.composeReason(input);

    const alert = await this.fraudAlertRepository.create({
      alertId: uuidv4(),
      transactionId: input.transactionId,
      userId: input.userId,
      fraudScore: input.fraudScore,
      riskLevel: input.riskLevel,
      reason,
      status: 'open'
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
