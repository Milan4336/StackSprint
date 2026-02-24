import axios from 'axios';
import { env } from '../config/env';
import { FraudExplanationItem } from '../models/FraudExplanation';

interface MlRequest {
  userId: string;
  amount: number;
  location: string;
  deviceId: string;
  timestamp: string;
}

export type MlRuntimeStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE';

export class MlServiceClient {
  private failureCount = 0;
  private lastError: string | null = null;
  private lastLatencyMs = 0;
  private circuitOpenUntil = 0;
  private status: MlRuntimeStatus = 'HEALTHY';

  private readonly failThreshold = env.ML_CIRCUIT_FAIL_THRESHOLD;
  private readonly resetMs = env.ML_CIRCUIT_RESET_SECONDS * 1000;

  private openCircuit(reason: string) {
    this.status = 'OFFLINE';
    this.lastError = reason;
    this.circuitOpenUntil = Date.now() + this.resetMs;
  }

  private markFailure(reason: string) {
    this.failureCount += 1;
    this.lastError = reason;

    if (this.failureCount >= this.failThreshold) {
      this.openCircuit(reason);
      return;
    }

    this.status = 'DEGRADED';
  }

  private markSuccess(latencyMs: number) {
    this.lastLatencyMs = latencyMs;
    this.failureCount = 0;
    this.lastError = null;
    this.circuitOpenUntil = 0;
    this.status = 'HEALTHY';
  }

  private canAttempt(): boolean {
    if (this.status !== 'OFFLINE') {
      return true;
    }
    if (Date.now() >= this.circuitOpenUntil) {
      this.status = 'DEGRADED';
      return true;
    }
    return false;
  }

  async score(payload: MlRequest): Promise<{
    fraudScore: number;
    isFraud: boolean;
    explanations: FraudExplanationItem[];
  }> {
    if (!this.canAttempt()) {
      throw new Error(`ML circuit breaker open until ${new Date(this.circuitOpenUntil).toISOString()}`);
    }

    const startedAt = Date.now();
    const response = await axios.post<{
      fraudScore: number;
      isFraud: boolean;
      explanations: FraudExplanationItem[];
    }>(`${env.ML_SERVICE_URL}/predict`, payload, {
      timeout: 2500
    }).catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : 'Unknown ML error';
      this.markFailure(reason);
      throw error;
    });

    this.markSuccess(Date.now() - startedAt);
    return response.data;
  }

  async healthCheck(): Promise<void> {
    await axios.get(`${env.ML_SERVICE_URL}/health`, { timeout: 2500 });
  }

  getStatus() {
    return {
      status: this.status,
      failureCount: this.failureCount,
      lastLatencyMs: this.lastLatencyMs,
      lastError: this.lastError,
      circuitOpenUntil: this.circuitOpenUntil ? new Date(this.circuitOpenUntil).toISOString() : null
    };
  }

  getModelInfo() {
    return {
      modelName: env.MODEL_NAME,
      modelVersion: env.MODEL_VERSION,
      mlStatus: this.status,
      lastLatencyMs: this.lastLatencyMs
    };
  }
}
