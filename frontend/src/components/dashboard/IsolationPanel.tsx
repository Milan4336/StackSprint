import { useEffect, useState } from 'react';
import { User, Smartphone, ShieldBan } from 'lucide-react';
import { HUDPanel } from '../visual/HUDDecorations';
import { monitoringApi } from '../../api/client';

export const IsolationPanel = () => {
    const [devices, setDevices] = useState<any[]>([]);

    // In a real app we would have an API for fetching frozen users or transactions too.
    // For this demonstration, we will list only the Critical devices fetched from getDevices().

    useEffect(() => {
        // Fetch devices and filter critical risk
        monitoringApi.getDevices(100).then(data => {
            setDevices(data.filter(d => d.riskLevel === 'High'));
        }).catch(() => { });
    }, []);

    return (
        <HUDPanel title="Containment & Isolation">
            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto modern-scrollbar">
                {devices.length === 0 ? (
                    <div className="flex items-center justify-center p-6 bg-slate-900/50 rounded border border-white/5 border-dashed">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">No entities currently isolated.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {devices.map((device, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <Smartphone size={16} className="text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white font-mono">{device.deviceId}</p>
                                        <p className="text-[10px] text-red-400 uppercase tracking-widest mt-0.5 ml-0.5">Device Isolated</p>
                                    </div>
                                </div>
                                <ShieldBan size={16} className="text-red-500" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </HUDPanel>
    );
};
