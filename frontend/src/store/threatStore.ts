import { create } from 'zustand';
import { MlStatus } from '../types';
import { safeDate } from '../utils/date';

export type ThreatLevel = 'NORMAL' | 'ELEVATED' | 'CRITICAL';

const HIGH_RISK_WINDOW_MS = 5 * 60 * 1000;
const HIGH_RISK_BURST_THRESHOLD = 4;
const ELEVATED_FRAUD_RATE = 12;
const CRITICAL_FRAUD_RATE = 25;

interface ThreatEvaluation {
  threatLevel: ThreatLevel;
  reason: string;
}

interface AlertLike {
  riskLevel?: string;
  fraudScore?: number;
  createdAt?: string;
  timestamp?: string;
}

interface ThreatStoreState {
  threatLevel: ThreatLevel;
  recentHighRiskCount: number;
  fraudRate: number;
  mlStatus: MlStatus;
  simulationActive: boolean;
  reason: string;
  highRiskAlertTimestamps: number[];
  setFraudRate: (rate: number) => void;
  setMlStatus: (status: MlStatus) => void;
  setSimulationActive: (active: boolean) => void;
  ingestAlert: (alert: AlertLike) => void;
  syncRecentHighRiskFromAlerts: (alerts: AlertLike[]) => void;
  recomputeThreat: () => void;
  resetThreatState: () => void;
}

const clampFraudRate = (value: number): number => Math.max(0, Math.min(100, value));

const normalizeTimestamp = (value?: string): number => safeDate(value)?.getTime() ?? Date.now();

const pruneHighRiskWindow = (timestamps: number[], now = Date.now()): number[] =>
  timestamps.filter((ts) => now - ts <= HIGH_RISK_WINDOW_MS);

const evaluateThreat = (state: Pick<ThreatStoreState, 'fraudRate' | 'recentHighRiskCount' | 'mlStatus' | 'simulationActive'>): ThreatEvaluation => {
  if (state.recentHighRiskCount >= HIGH_RISK_BURST_THRESHOLD) {
    return {
      threatLevel: 'CRITICAL',
      reason: `High-risk alert burst detected (${state.recentHighRiskCount} in last 5 minutes).`
    };
  }

  if (state.fraudRate >= CRITICAL_FRAUD_RATE) {
    return {
      threatLevel: 'CRITICAL',
      reason: `Fraud rate is critically high (${state.fraudRate.toFixed(1)}%).`
    };
  }

  if (state.mlStatus === 'OFFLINE') {
    return {
      threatLevel: 'ELEVATED',
      reason: 'ML service is offline. Platform is running in fallback mode.'
    };
  }

  if (state.simulationActive) {
    return {
      threatLevel: 'ELEVATED',
      reason: 'Fraud simulation is active.'
    };
  }

  if (state.mlStatus === 'DEGRADED') {
    return {
      threatLevel: 'ELEVATED',
      reason: 'ML service is degraded.'
    };
  }

  if (state.fraudRate >= ELEVATED_FRAUD_RATE) {
    return {
      threatLevel: 'ELEVATED',
      reason: `Fraud rate is elevated (${state.fraudRate.toFixed(1)}%).`
    };
  }

  return {
    threatLevel: 'NORMAL',
    reason: 'Threat indicators are within baseline levels.'
  };
};

export const useThreatStore = create<ThreatStoreState>((set, get) => ({
  threatLevel: 'NORMAL',
  recentHighRiskCount: 0,
  fraudRate: 0,
  mlStatus: 'HEALTHY',
  simulationActive: false,
  reason: 'Threat indicators are within baseline levels.',
  highRiskAlertTimestamps: [],

  setFraudRate: (rate) => {
    set({
      fraudRate: clampFraudRate(Number.isFinite(rate) ? rate : 0)
    });
    get().recomputeThreat();
  },

  setMlStatus: (status) => {
    set({ mlStatus: status });
    get().recomputeThreat();
  },

  setSimulationActive: (active) => {
    set({ simulationActive: active });
    get().recomputeThreat();
  },

  ingestAlert: (alert) => {
    const isHighRisk = alert.riskLevel === 'High' || Number(alert.fraudScore ?? 0) >= 71;
    if (!isHighRisk) {
      return;
    }

    set((state) => {
      const nextTimestamps = pruneHighRiskWindow([
        ...state.highRiskAlertTimestamps,
        normalizeTimestamp(alert.createdAt ?? alert.timestamp)
      ]);

      return {
        highRiskAlertTimestamps: nextTimestamps,
        recentHighRiskCount: nextTimestamps.length
      };
    });
    get().recomputeThreat();
  },

  syncRecentHighRiskFromAlerts: (alerts) => {
    const now = Date.now();
    const timestamps = alerts
      .filter((alert) => alert.riskLevel === 'High' || Number(alert.fraudScore ?? 0) >= 71)
      .map((alert) => normalizeTimestamp(alert.createdAt ?? alert.timestamp))
      .filter((ts) => now - ts <= HIGH_RISK_WINDOW_MS);

    set({
      highRiskAlertTimestamps: timestamps,
      recentHighRiskCount: timestamps.length
    });
    get().recomputeThreat();
  },

  recomputeThreat: () => {
    set((state) => {
      const nextWindow = pruneHighRiskWindow(state.highRiskAlertTimestamps);
      const evaluation = evaluateThreat({
        fraudRate: state.fraudRate,
        recentHighRiskCount: nextWindow.length,
        mlStatus: state.mlStatus,
        simulationActive: state.simulationActive
      });

      return {
        highRiskAlertTimestamps: nextWindow,
        recentHighRiskCount: nextWindow.length,
        threatLevel: evaluation.threatLevel,
        reason: evaluation.reason
      };
    });
  },

  resetThreatState: () => {
    set({
      threatLevel: 'NORMAL',
      recentHighRiskCount: 0,
      fraudRate: 0,
      mlStatus: 'HEALTHY',
      simulationActive: false,
      reason: 'Threat indicators are within baseline levels.',
      highRiskAlertTimestamps: []
    });
  }
}));

