import { motion } from 'framer-motion';

export const SOCGrid = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,transparent_0%,#02040a_100%)]" />

            {/* Moving Scanning Line */}
            <motion.div
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-x-0 h-px bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            />
        </div>
    );
};
