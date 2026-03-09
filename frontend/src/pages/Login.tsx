import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Fingerprint, LockKeyhole, Mail, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, monitoringApi } from '../api/client';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
import { useAuthStore } from '../store/auth';
import { useIntroStore } from '../store/intro';
import { SystemBootIntro } from '../components/intro/SystemBootIntro';
import { useUISound } from '../hooks/useUISound';
import { HUDCorner, HUDScanline } from '../components/visual/HUDDecorations';
import { useThemeStore } from '../store/themeStore';
import { Link } from 'react-router-dom';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const setPendingIntro = useIntroStore((state) => state.setPendingIntro);
  const { playSound } = useUISound();
  const { theme } = useThemeStore();

  const themeColors = {
    cyber: { primary: 'text-blue-500', accent: 'bg-blue-500', glow: 'shadow-[0_0_20px_rgba(37,99,235,0.3)]', inputFocus: 'focus:border-blue-500/50 focus:bg-blue-900/10' },
    neon: { primary: 'text-purple-500', accent: 'bg-purple-600', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', inputFocus: 'focus:border-purple-500/50 focus:bg-purple-900/10' },
    tactical: { primary: 'text-emerald-500', accent: 'bg-emerald-600', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', inputFocus: 'focus:border-emerald-500/50 focus:bg-emerald-900/10' }
  }[theme] || { primary: 'text-blue-500', accent: 'bg-blue-500', glow: 'shadow-[0_0_20px_rgba(37,99,235,0.3)]', inputFocus: 'focus:border-blue-500/50 focus:bg-blue-900/10' };

  const [email, setEmail] = useState('admin@fraud.local');
  const [password, setPassword] = useState('StrongPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBoot, setShowBoot] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    playSound('SCAN');

    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      const response = await apiClient.post<{ token: string }>('/auth/login', { email, password, deviceFingerprint });
      localStorage.setItem('token', response.data.token);
      const userProfile = await monitoringApi.getMe();

      setPendingIntro(false);
      login(response.data.token, userProfile);
      setShowBoot(true);
    } catch (err) {
      playSound('ALERT');
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { error?: string } | undefined)?.error || 'Invalid credentials');
      } else {
        setError('Unable to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showBoot && <SystemBootIntro onComplete={() => navigate(from, { replace: true })} />}
      </AnimatePresence>
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Side: Branding / Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block space-y-8"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={`h-4 w-1 ${themeColors.accent}`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${themeColors.primary} opacity-60`}>Intelligence Protocol</span>
              </div>
              <h1 className="text-6xl font-black uppercase tracking-tighter text-white italic">
                FRAUD <span className={`${themeColors.primary} bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent`}>CENTRAL</span>
              </h1>
              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                SOC-grade financial surveillance and autonomous threat response platform.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 relative overflow-hidden">
                <HUDCorner position="top-right" />
                <Activity size={20} className={`${themeColors.primary} mb-3`} />
                <p className="text-xs font-black uppercase tracking-widest text-white mb-1">Live Vector</p>
                <p className="text-[10px] text-slate-500">Global node synchronization</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <ShieldCheck size={20} className="text-emerald-500 mb-3" />
                <p className="text-xs font-black uppercase tracking-widest text-white mb-1">Hardened</p>
                <p className="text-[10px] text-slate-500">Military-grade protection</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Terminal size={10} /> ACCESS_GRANTED</span>
              <span>•</span>
              <span>ZULU_9_ONLINE</span>
            </div>
          </motion.div>

          {/* Right Side: Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="hud-panel p-10 relative overflow-hidden group"
          >
            <HUDCorner position="top-left" />
            <HUDCorner position="top-right" />
            <HUDCorner position="bottom-left" />
            <HUDCorner position="bottom-right" />
            <HUDScanline />

            <div className="mb-10">
              <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white italic">Identification</h2>
              <div className={`h-0.5 w-12 ${themeColors.accent} mt-2`} />
              {location.state?.message && (
                <p className="mt-4 text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse">
                  {location.state.message}
                </p>
              )}
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Node / Email</label>
                <div className="relative group/input">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:${themeColors.primary} transition-colors`} size={16} />
                  <input
                    className={`w-full h-14 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white outline-none transition-all ${themeColors.inputFocus}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    onFocus={() => playSound('HOVER')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Key / Password</label>
                <div className="relative group/input">
                  <LockKeyhole className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:${themeColors.primary} transition-colors`} size={16} />
                  <input
                    className={`w-full h-14 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white outline-none transition-all ${themeColors.inputFocus}`}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    onFocus={() => playSound('HOVER')}
                  />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-3">
                  <Terminal size={14} /> {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => playSound('HOVER')}
                className={`w-full h-14 ${themeColors.accent} hover:opacity-90 text-white font-black uppercase tracking-[0.2em] text-xs transition-all rounded-xl ${themeColors.glow} flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50`}
              >
                {loading ? 'SYNCHRONIZING...' : 'AUTHORIZE ACCESS'}
              </button>
            </form>

            {/* Footer deco */}
            <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center text-[8px] font-mono text-slate-700 uppercase tracking-widest">
              <span>© 2026 STACK_SPRINT_FRAUD</span>
              <span>V2.4.0-BETA</span>
            </div>

            <div className="text-center mt-6">
              <Link to="/register" className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                New across the network? <span className={themeColors.primary}>Join Protocol here</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
