import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useMemo } from 'react';
import { ThreatLevel, useThreatStore } from '../../store/threatStore';

const toneByLevel: Record<ThreatLevel, string> = {
  NORMAL: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
  ELEVATED: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
  CRITICAL: 'border-red-500/35 bg-red-500/10 text-red-300'
};

const dotByLevel: Record<ThreatLevel, string> = {
  NORMAL: 'bg-emerald-400',
  ELEVATED: 'bg-amber-400',
  CRITICAL: 'bg-red-400'
};

export const ThreatLevelIndicator = () => {
  const threatLevel = useThreatStore((state) => state.threatLevel);
  const reason = useThreatStore((state) => state.reason);
  const recentHighRiskCount = useThreatStore((state) => state.recentHighRiskCount);
  const fraudRate = useThreatStore((state) => state.fraudRate);
  const mlStatus = useThreatStore((state) => state.mlStatus);
  const simulationActive = useThreatStore((state) => state.simulationActive);

  const Icon = threatLevel === 'CRITICAL' ? ShieldAlert : AlertTriangle;
  const pulseClass = threatLevel === 'CRITICAL' ? 'threat-critical-pulse' : '';

  const summary = useMemo(
    () =>
      [
        reason,
        `Fraud rate: ${fraudRate.toFixed(1)}%`,
        `High-risk alerts (5m): ${recentHighRiskCount}`,
        `ML status: ${mlStatus}`,
        `Simulation active: ${simulationActive ? 'Yes' : 'No'}`
      ].join('\n'),
    [fraudRate, mlStatus, reason, recentHighRiskCount, simulationActive]
  );

  return (
    <div className="group relative hidden md:block" title={summary}>
      <span
        className={[
          'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold',
          toneByLevel[threatLevel],
          pulseClass
        ].join(' ')}
      >
        <span className={`h-2 w-2 rounded-full ${dotByLevel[threatLevel]}`} />
        <Icon size={12} />
        Threat {threatLevel}
      </span>

      <div className="pointer-events-none absolute right-0 top-9 z-50 w-72 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-xs text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100">
        <p className="mb-1 font-semibold uppercase tracking-[0.12em] text-slate-300">Threat Context</p>
        <p className="whitespace-pre-line text-slate-300">{summary}</p>
      </div>
    </div>
  );
};

