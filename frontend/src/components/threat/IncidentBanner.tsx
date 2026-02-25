import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useThreatStore } from '../../store/threatStore';

export const IncidentBanner = () => {
  const threatLevel = useThreatStore((state) => state.threatLevel);
  const reason = useThreatStore((state) => state.reason);

  return (
    <AnimatePresence>
      {threatLevel === 'CRITICAL' ? (
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="border-b border-red-500/35 bg-gradient-to-r from-red-500/20 via-red-500/10 to-amber-500/15 px-4 py-2.5 text-red-100 shadow-[0_10px_40px_-20px_rgba(239,68,68,0.75)]"
        >
          <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 text-sm">
            <ShieldAlert size={16} className="text-red-300" />
            <p className="font-semibold">Incident Mode Active — Elevated Fraud Activity Detected.</p>
            <p className="hidden text-red-200/90 lg:block">{reason}</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

