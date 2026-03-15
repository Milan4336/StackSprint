import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, KeyRound, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { useThreatStore } from '../../store/threatStore';
import { useAuthStore } from '../../store/auth';
import type { MfaSetupResponse, MfaStatusResponse } from '../../types';

const LOCKDOWN_SESSION_MINUTES = 10;

const parseThreshold = () => {
  const raw = Number(import.meta.env.VITE_LOCKDOWN_THREAT_THRESHOLD ?? 90);
  if (Number.isNaN(raw)) return 90;
  return Math.max(1, Math.min(100, raw));
};

export const ThreatLockdownModal = () => {
  const threshold = useMemo(parseThreshold, []);
  const threatIndex = useThreatStore((state) => state.threatIndex);
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MfaStatusResponse | null>(null);
  const [setupPayload, setSetupPayload] = useState<MfaSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocked(false);
      return;
    }

    if (threatIndex < threshold) {
      setLocked(false);
      return;
    }

    const unlockUntilMs = Number(sessionStorage.getItem('mfa_unlock_until_ms') ?? '0');
    if (!unlockUntilMs || Date.now() >= unlockUntilMs) {
      setLocked(true);
    }
  }, [isAuthenticated, threshold, threatIndex]);

  useEffect(() => {
    if (!locked) return;

    let cancelled = false;
    const loadStatus = async () => {
      setStatusLoading(true);
      try {
        const status = await monitoringApi.getMfaStatus();
        if (!cancelled) {
          setMfaStatus(status);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to fetch MFA status. Please retry.');
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [locked]);

  if (!locked) {
    return null;
  }

  const refreshProfile = async (token: string) => {
    login(token, user ?? undefined);
    try {
      const profile = await monitoringApi.getMe();
      setUser(profile);
    } catch {
      // If profile refresh fails, session remains authenticated with latest token.
    }
  };

  const unlockSession = () => {
    const unlockUntilMs = Date.now() + LOCKDOWN_SESSION_MINUTES * 60 * 1000;
    sessionStorage.setItem('mfa_unlock_until_ms', String(unlockUntilMs));
    setCode('');
    setError(null);
    setLocked(false);
  };

  const onSetupMfa = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await monitoringApi.setupMfa();
      setSetupPayload(payload);
      const refreshed = await monitoringApi.getMfaStatus();
      setMfaStatus(refreshed);
    } catch (err: any) {
      setError((err?.response?.data as { error?: string } | undefined)?.error ?? 'Unable to start MFA setup.');
    } finally {
      setLoading(false);
    }
  };

  const onEnableOrVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length < 6) {
      setError('Enter a valid 6-digit authenticator code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mfaStatus?.enabled) {
        const verification = await monitoringApi.verifyMfa(code, 'THREAT_LOCKDOWN');
        await refreshProfile(verification.token);
      } else {
        const enabled = await monitoringApi.enableMfa(code);
        await refreshProfile(enabled.token);
        const refreshed = await monitoringApi.getMfaStatus();
        setMfaStatus(refreshed);
      }
      unlockSession();
    } catch (err: any) {
      setError((err?.response?.data as { error?: string } | undefined)?.error ?? 'MFA validation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-slate-900/95 p-6 shadow-[0_0_60px_rgba(220,38,38,0.25)]">
        <p className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-red-200">
          <AlertTriangle size={14} />
          Threat Lockdown Active
        </p>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-50">
          System Locked at Threat Index {Math.round(threatIndex)}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Critical threat threshold ({threshold}) reached. Multi-factor verification is required to continue operations.
        </p>

        {statusLoading ? (
          <p className="mt-4 text-sm text-slate-300">Checking MFA enrollment status...</p>
        ) : null}

        {!statusLoading && !mfaStatus?.enabled ? (
          <div className="mt-4 space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-semibold">MFA is not enabled for this account.</p>
            <p>Complete setup using Google Authenticator (or any TOTP app), then verify code to unlock.</p>
            {!setupPayload ? (
              <button
                type="button"
                onClick={onSetupMfa}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300/40 px-3 py-2 font-semibold transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldAlert size={15} />
                {loading ? 'Generating Secret...' : 'Generate Authenticator Secret'}
              </button>
            ) : (
              <div className="space-y-2 rounded-lg border border-amber-300/30 bg-slate-900/60 p-3 text-xs text-amber-100">
                <p>
                  <span className="font-semibold">Secret:</span> <span className="tracking-wider">{setupPayload.secret}</span>
                </p>
                <a
                  href={setupPayload.otpauthUrl}
                  className="inline-flex items-center gap-1 text-amber-200 underline"
                >
                  <LinkIcon size={12} />
                  Open otpauth link
                </a>
              </div>
            )}
          </div>
        ) : null}

        <form className="mt-5 space-y-3" onSubmit={onEnableOrVerify}>
          <label className="block text-sm font-semibold text-slate-200">
            Authenticator Code
            <div className="relative mt-1">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                className="w-full rounded-lg border border-slate-600 bg-slate-950/85 py-2.5 pl-9 pr-3 text-sm tracking-[0.18em] text-slate-100 outline-none ring-red-400 transition focus:border-red-400 focus:ring"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
          </label>

          {error ? <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:from-red-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Validating...' : mfaStatus?.enabled ? 'Verify & Unlock' : 'Enable MFA & Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};

