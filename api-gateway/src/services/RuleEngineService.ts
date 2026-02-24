import { env } from '../config/env';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { haversineKm } from '../utils/geolocation';

interface RuleInput {
  userId: string;
  amount: number;
  location: string;
  deviceId: string;
  ipAddress: string;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
}

export interface RuleEvaluationResult {
  score: number;
  reasons: string[];
  geoVelocityFlag: boolean;
}

export class RuleEngineService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async evaluate(input: RuleInput): Promise<RuleEvaluationResult> {
    let score = 0;
    const reasons: string[] = [];
    let geoVelocityFlag = false;

    if (input.amount >= env.HIGH_AMOUNT_THRESHOLD) {
      score += 40;
      reasons.push(`High transaction amount (${input.amount}) exceeds threshold ${env.HIGH_AMOUNT_THRESHOLD}.`);
    }

    const from = new Date(input.timestamp.getTime() - env.VELOCITY_WINDOW_MINUTES * 60 * 1000);
    const recent = await this.transactionRepository.findByUserWithinWindow(input.userId, from);
    if (recent.length >= env.VELOCITY_TX_THRESHOLD) {
      score += 25;
      reasons.push(
        `High velocity detected (${recent.length + 1} transactions in ${env.VELOCITY_WINDOW_MINUTES} minutes).`
      );
    }

    const latest = await this.transactionRepository.findLatestByUser(input.userId);
    if (latest && latest.location !== input.location) {
      score += 20;
      reasons.push(`Location anomaly: ${latest.location} -> ${input.location}.`);
    }

    if (latest && latest.deviceId !== input.deviceId) {
      score += 15;
      reasons.push(`New device detected: previous ${latest.deviceId}, current ${input.deviceId}.`);
    }

    if (latest && latest.ipAddress !== input.ipAddress) {
      score += 10;
      reasons.push(`IP change detected: ${latest.ipAddress} -> ${input.ipAddress}.`);
    }

    const latestHasCoords = typeof latest?.latitude === 'number' && typeof latest?.longitude === 'number';
    const inputHasCoords = typeof input.latitude === 'number' && typeof input.longitude === 'number';
    if (latest && latestHasCoords && inputHasCoords) {
      const hoursDiff = Math.abs(input.timestamp.getTime() - latest.timestamp.getTime()) / (1000 * 60 * 60);
      const geoDistance = haversineKm(
        { latitude: latest.latitude as number, longitude: latest.longitude as number },
        { latitude: input.latitude as number, longitude: input.longitude as number }
      );

      if (geoDistance > 1500 && hoursDiff < 2) {
        score += 30;
        geoVelocityFlag = true;
        reasons.push(
          `Suspicious geo velocity detected (${Math.round(geoDistance)}km in ${hoursDiff.toFixed(2)}h).`
        );
      }
    }

    const from24h = new Date(input.timestamp.getTime() - 24 * 60 * 60 * 1000);
    const dayHistory = await this.transactionRepository.findByUserWithinWindow(input.userId, from24h);
    const uniqueDevices = new Set(dayHistory.map((tx) => tx.deviceId));
    uniqueDevices.add(input.deviceId);
    if (uniqueDevices.size >= 3) {
      score += 10;
      reasons.push(`Multiple devices used in 24h (${uniqueDevices.size} unique devices).`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons,
      geoVelocityFlag
    };
  }
}
