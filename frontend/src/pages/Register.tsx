import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Fingerprint, LockKeyhole, Mail, User, Phone, ShieldCheck, Terminal, Globe } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useUISound } from '../hooks/useUISound';
import { HUDCorner, HUDScanline } from '../components/visual/HUDDecorations';
import { useThemeStore } from '../store/themeStore';

export const Register = () => {
    const navigate = useNavigate();
    const { playSound } = useUISound();
    const { theme } = useThemeStore();

    const themeColors = {
        cyber: { primary: 'text-blue-500', accent: 'bg-blue-500', glow: 'shadow-[0_0_20px_rgba(37,99,235,0.3)]', inputFocus: 'focus:border-blue-500/50 focus:bg-blue-900/10' },
        neon: { primary: 'text-purple-500', accent: 'bg-purple-600', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', inputFocus: 'focus:border-purple-500/50 focus:bg-purple-900/10' },
        tactical: { primary: 'text-emerald-500', accent: 'bg-emerald-600', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', inputFocus: 'focus:border-emerald-500/50 focus:bg-emerald-900/10' }
    }[theme] || { primary: 'text-blue-500', accent: 'bg-blue-500', glow: 'shadow-[0_0_20px_rgba(37,99,235,0.3)]', inputFocus: 'focus:border-blue-500/50 focus:bg-blue-900/10' };

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        mfaEnabled: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            playSound('ALERT');
            return;
        }

        setLoading(true);
        setError(null);
        playSound('SCAN');

        try {
            await apiClient.post('/auth/register', {
                ...formData,
                role: 'user'
            });
            navigate('/login', { state: { message: 'Registration successful. Please login.' } });
        } catch (err) {
            playSound('ALERT');
            if (axios.isAxiosError(err)) {
                setError((err.response?.data as { error?: string } | undefined)?.error || 'Registration failed');
            } else {
                setError('Unable to register');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
            <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Side: Onboarding Info */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:block space-y-8"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className={`h-4 w-1 ${themeColors.accent}`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${themeColors.primary} opacity-60`}>Citizen Onboarding</span>
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter text-white italic">
                            JOIN THE <span className={`${themeColors.primary} bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent`}>NETWORK</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                            Secure your digital identity with bank-grade surveillance and real-time fraud protection.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-white/5 bg-white/5 relative overflow-hidden">
                            <HUDCorner position="top-right" />
                            <ShieldCheck size={20} className={`${themeColors.primary} mb-3`} />
                            <p className="text-xs font-black uppercase tracking-widest text-white mb-1">Zero Trust</p>
                            <p className="text-[10px] text-slate-500">Verified identity architecture</p>
                        </div>
                        <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                            <Fingerprint size={20} className="text-emerald-500 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-white mb-1">Behavioral</p>
                            <p className="text-[10px] text-slate-500">Advanced pattern recognition</p>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Register Form */}
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

                    <div className="mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white italic">Registration</h2>
                        <div className={`h-0.5 w-12 ${themeColors.accent} mt-2`} />
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Legal Name</label>
                                <div className="relative group/input">
                                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:${themeColors.primary} transition-colors`} size={16} />
                                    <input
                                        className={`w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white outline-none transition-all ${themeColors.inputFocus}`}
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                        onFocus={() => playSound('HOVER')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Number</label>
                                <div className="relative group/input">
                                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:${themeColors.primary} transition-colors`} size={16} />
                                    <input
                                        className={`w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white outline-none transition-all ${themeColors.inputFocus}`}
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        onFocus={() => playSound('HOVER')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Node / Email</label>
                            <div className="relative group/input">
                                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:${themeColors.primary} transition-colors`} size={16} />
                                <input
                                    className={`w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white outline-none transition-all ${themeColors.inputFocus}`}
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    onFocus={() => playSound('HOVER')}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Key</label>
                                <div className="relative group/input">
                                    <LockKeyhole className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:${themeColors.primary} transition-colors`} size={16} />
                                    <input
                                        className={`w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white outline-none transition-all ${themeColors.inputFocus}`}
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        onFocus={() => playSound('HOVER')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirm Key</label>
                                <div className="relative group/input">
                                    <LockKeyhole className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:${themeColors.primary} transition-colors`} size={16} />
                                    <input
                                        className={`w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white outline-none transition-all ${themeColors.inputFocus}`}
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                        onFocus={() => playSound('HOVER')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-all cursor-pointer" onClick={() => setFormData({ ...formData, mfaEnabled: !formData.mfaEnabled })}>
                            <div className={`h-4 w-4 rounded border ${formData.mfaEnabled ? themeColors.accent + ' border-transparent' : 'border-white/20'} flex items-center justify-center transition-all`}>
                                {formData.mfaEnabled && <ShieldCheck size={10} className="text-white" />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Enable Multi-Factor Authentication (MFA)</span>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-3">
                                <Terminal size={14} /> {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            onMouseEnter={() => playSound('HOVER')}
                            className={`w-full h-12 ${themeColors.accent} hover:opacity-90 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all rounded-xl ${themeColors.glow} flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50`}
                        >
                            {loading ? 'INITIALIZING PROTOCOL...' : 'JOIN INTELLIGENCE NETWORK'}
                        </button>

                        <div className="text-center mt-4">
                            <Link to="/login" className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                                Already part of the network? <span className={themeColors.primary}>Login here</span>
                            </Link>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};
