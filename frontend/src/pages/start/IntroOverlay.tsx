import { motion, AnimatePresence } from 'framer-motion';
import snakeSpiritAsset from '../../assets/lila/snake-spirit.svg';

interface IntroOverlayProps {
  visible: boolean;
}

export const IntroOverlay = ({ visible }: IntroOverlayProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'radial-gradient(circle at 50% 46%, color-mix(in srgb, var(--lila-accent) 26%, transparent), color-mix(in srgb, var(--lila-bg-main) 92%, black) 72%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-2 rounded-[26px] border"
            style={{
              borderColor: 'color-mix(in srgb, var(--lila-accent) 38%, var(--lila-border-soft))',
              boxShadow: '0 0 32px color-mix(in srgb, var(--lila-accent) 24%, transparent) inset',
            }}
          />

          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0.24 }}
            animate={{ opacity: [0.24, 0.62, 0.28] }}
            transition={{ duration: 1.15, ease: 'easeInOut' }}
            style={{
              background:
                'conic-gradient(from 180deg at 50% 50%, transparent 0deg, color-mix(in srgb, var(--lila-accent) 18%, transparent) 48deg, transparent 96deg, color-mix(in srgb, var(--lila-accent) 16%, transparent) 180deg, transparent 320deg)',
              filter: 'blur(22px)',
            }}
          />

          <motion.div
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          >
            <img
              src={snakeSpiritAsset}
              alt="Soulvio Lila"
              className="h-20 w-20 rounded-full border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/88 p-3 shadow-[0_18px_48px_rgba(10,12,32,0.38)]"
            />
            <p className="mt-4 text-[12px] uppercase tracking-[0.34em] text-[var(--lila-text-muted)]">Soulvio Lila</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
