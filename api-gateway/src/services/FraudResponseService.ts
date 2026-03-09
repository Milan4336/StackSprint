import { v4 as uuidv4 } from 'uuid';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { EventBusService } from './EventBusService';
import { SettingsService } from './SettingsService';
import { AuditService } from './AuditService';
import { UserModel } from '../models/User';
import { DeviceReputation } from '../models/DeviceReputation';
import { FraudAlertModel } from '../models/FraudAlert';
import { SystemSettingModel } from '../models/SystemSetting';

export interface FraudResponseInput {
    transactionId: string;
    userId: string;
    fraudScore: number;
    deviceId?: string;
    ipAddress?: string;
    location?: string;
    ruleReasons?: string[];
    explanations?: FraudExplanationItem[];
}

export class FraudResponseService {
    constructor(
        private readonly fraudAlertRepository: FraudAlertRepository,
        private readonly eventBusService: EventBusService,
        private readonly settingsService: SettingsService,
        private readonly auditService: AuditService,
        private readonly thresholdSuspicious = 40,
        private readonly thresholdHigh = 70,
        private readonly thresholdCritical = 90
    ) { }

    async process(input: FraudResponseInput) {
        const { fraudScore, userId, transactionId, deviceId } = input;

        let actionTaken = 'ALLOW';
        let newStatus: 'ACTIVE' | 'RESTRICTED' | 'FROZEN' = 'ACTIVE';

        // Tier 4: Critical Threat (> 90%)
        if (fraudScore >= this.thresholdCritical) {
            actionTaken = 'BLOCK';
            newStatus = 'FROZEN';

            // Micro-isolation: freeze specific device
            if (deviceId) {
                await DeviceReputation.findOneAndUpdate(
                    { deviceId },
                    { riskLevel: 'Critical' },
                    { upsert: true }
                );
            }
        }
        // Tier 3: High Risk (70-90%)
        else if (fraudScore >= this.thresholdHigh) {
            actionTaken = 'REQUIRE_MANUAL_REVIEW';
            newStatus = 'FROZEN'; // Temporarily freeze suspicious account
        }
        // Tier 2: Suspicious Activity (40-70%)
        else if (fraudScore >= this.thresholdSuspicious) {
            actionTaken = 'STEP_UP_AUTH';
            newStatus = 'RESTRICTED';
        }

        // Safe Mode Evaluation
        if (fraudScore >= this.thresholdHigh) {
            await this.evaluateSafeMode();
        }

        const settings = await this.settingsService.getRuntimeConfig();
        if (settings.safeMode && fraudScore < this.thresholdCritical) {
            // Apply Safe Mode rules (e.g. high-value tx requires manual approval)
            if (actionTaken === 'ALLOW' || actionTaken === 'STEP_UP_AUTH') {
                actionTaken = 'REQUIRE_MANUAL_REVIEW';
            }
        }

        // Update User Status if necessary
        if (newStatus !== 'ACTIVE' || fraudScore >= this.thresholdSuspicious) {
            const updatedUser = await UserModel.findOneAndUpdate(
                { userId },
                { status: newStatus }
            );

            if (updatedUser && updatedUser.status !== newStatus) {
                await this.auditService.log({
                    eventType: 'user.account.status_changed',
                    action: 'update',
                    entityType: 'user',
                    entityId: userId,
                    metadata: {
                        previousStatus: updatedUser.status,
                        newStatus,
                        reason: `Fraud score ${fraudScore} met threshold`,
                        transactionId
                    }
                });
            }
        }

        // Create Alert if score is high enough
        if (fraudScore >= this.thresholdSuspicious) {
            const riskLevel = fraudScore >= this.thresholdHigh ? 'High' : 'Medium';
            const alert = await this.fraudAlertRepository.create({
                alertId: uuidv4(),
                transactionId,
                userId,
                fraudScore,
                riskLevel,
                reason: `Autonomous response: ${actionTaken}. Detected anomalies in behavior/ML/rules.`,
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await this.eventBusService.publishFraudAlert(alert);
        }

        return { actionTaken, newStatus };
    }

    private async evaluateSafeMode() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentHighRiskCount = await FraudAlertModel.countDocuments({
            createdAt: { $gte: fiveMinutesAgo },
            fraudScore: { $gte: this.thresholdHigh }
        });

        if (recentHighRiskCount >= 4) {
            const setting = await SystemSettingModel.findOne();
            if (setting && !setting.safeMode) {
                await this.settingsService.update({ safeMode: true });

                await this.auditService.log({
                    eventType: 'system.safemode.enabled',
                    action: 'update',
                    entityType: 'system',
                    entityId: 'global',
                    metadata: {
                        reason: `Multiple high-risk transactions detected (${recentHighRiskCount} in 5 mins)`
                    }
                });

                await this.eventBusService.publishDashboardEvent('system.safemode', { active: true });
            }
        }
    }
}
