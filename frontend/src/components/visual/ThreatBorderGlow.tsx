import { useThemeStore } from '../../store/theme';
import { useThreatStore } from '../../store/threatStore';

export const ThreatBorderGlow = () => {
    const threatIndex = useThreatStore((state: any) => state.threatIndex);
    const threatLevel = useThreatStore((state: any) => state.threatLevel);
    const enableThreatGlow = useThemeStore((state) => state.enableThreatGlow);

    // Determine active state from either numeric index OR level string
    const isElevated = threatIndex >= 40 || threatLevel === 'SUSPICIOUS' || threatLevel === 'HIGH';
    const isCritical = threatIndex >= 75 || threatLevel === 'CRITICAL';

    const glowColor = isCritical
        ? 'rgba(239, 68, 68, 0.6)'   // red
        : isElevated
            ? 'rgba(249, 115, 22, 0.45)' // orange
            : 'transparent';

    const boxShadow = isElevated
        ? `inset 0 0 ${isCritical ? 80 : 50}px 10px ${glowColor}, 0 0 ${isCritical ? 60 : 35}px 8px ${glowColor}`
        : 'none';

    if (!isElevated || !enableThreatGlow) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 9999,
                boxShadow,
                borderRadius: 0,
                animation: isCritical ? 'threatPulse 1.2s ease-in-out infinite' : 'threatPulseSlow 2.5s ease-in-out infinite',
                border: `1px solid ${glowColor}`,
            }}
        >
            {/* Top horizon glow bar */}
            {isCritical && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
                        animation: 'scanLine 2s linear infinite',
                    }}
                />
            )}

            <style>{`
                @keyframes threatPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.55; }
                }
                @keyframes threatPulseSlow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                @keyframes scanLine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
