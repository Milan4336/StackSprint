import { useState } from 'react';
import { ShieldCheck, Unlock, Key, AlertTriangle } from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { HUDPanel } from '../visual/HUDDecorations';

export const AdminControlPanel = () => {
    const [targetId, setTargetId] = useState('');
    const [actionType, setActionType] = useState<string>('user');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [mfaRequested, setMfaRequested] = useState(false);
    const [mfaCode, setMfaCode] = useState('');

    const handleInitialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!targetId.trim()) return;
        setMfaRequested(true);
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mfaCode.length !== 6) {
            setMessage({ type: 'error', text: 'Invalid MFA code format.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            await monitoringApi.verifyMfa(mfaCode, 'ADMIN_OVERRIDE');

            if (actionType === 'user') {
                await monitoringApi.unfreezeUser(targetId);
            } else if (actionType === 'device') {
                await monitoringApi.unfreezeDevice(targetId);
            } else if (actionType === 'transaction') {
                await monitoringApi.releaseTransaction(targetId);
            }
            setMessage({ type: 'success', text: `Successfully released ${actionType} ${targetId}.` });
            setTargetId('');
            setMfaRequested(false);
            setMfaCode('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to execute override.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <HUDPanel title="Admin Override Console">
            <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-400">Authorized personnel only. Multi-factor authentication required for manual security overrides.</p>

                {message && (
                    <div className={`p-3 rounded text-xs font-mono font-bold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {!mfaRequested ? (
                    <form onSubmit={handleInitialSubmit} className="space-y-4">
                        <div className="flex gap-4">
                            <select
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 w-1/3"
                            >
                                <option value="user">Unfreeze User</option>
                                <option value="device">Unfreeze Device</option>
                                <option value="transaction">Release Transaction</option>
                            </select>
                            <input
                                type="text"
                                placeholder={`Enter ${actionType} ID...`}
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1 font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!targetId.trim()}
                            className="flex items-center gap-2 justify-center w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-colors text-sm uppercase tracking-wider"
                        >
                            <Unlock size={16} /> Request Override
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleMfaSubmit} className="space-y-4 bg-slate-900 p-4 border border-blue-500/30 rounded">
                        <div className="flex items-center gap-2 text-amber-400 mb-2">
                            <AlertTriangle size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">MFA Required</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Enter 6-digit authenticator code"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                            className="w-full bg-black border border-slate-700 rounded p-3 text-center text-xl tracking-[0.5em] text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setMfaRequested(false)}
                                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded transition-colors text-xs uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={mfaCode.length !== 6 || loading}
                                className="w-2/3 flex items-center gap-2 justify-center bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2 rounded transition-colors text-sm uppercase tracking-wider"
                            >
                                {loading ? 'Executing...' : <><Key size={16} /> Authenticate</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </HUDPanel>
    );
};
