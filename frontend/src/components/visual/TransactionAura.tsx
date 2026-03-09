import { motion } from 'framer-motion';

interface TransactionAuraProps {
    riskScore: number;
    className?: string;
}

export const TransactionAura = ({ riskScore, className = "" }: TransactionAuraProps) => {
    const isHighRisk = riskScore >= 70;
    const isMediumRisk = riskScore >= 40 && riskScore < 70;

    if (riskScore < 40) return null;

    const colors = isHighRisk
        ? 'from-red-500/20 to-transparent'
        : 'from-amber-500/10 to-transparent';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute -inset-2 rounded-xl bg-gradient-to-r ${colors} blur-xl pointer-events-none z-0 ${className}`}
        >
            {isHighRisk && (
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-red-600/5 rounded-xl"
                />
            )}
        </motion.div>
    );
};
