import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo } from '../../components/BrandLogo';
import { CanvaWingAccent } from '../../components/CanvaWingAccent';
import type { StartBootPhase } from './appBootState';

interface IntroOverlayProps {
  visible: boolean;
  phase: StartBootPhase;
  loadingLabel?: string;
}

export const IntroOverlay = ({ visible, phase, loadingLabel }: IntroOverlayProps) => {
  const isAuthLoading = phase === 'BOOT_AUTH_LOADING';
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="start-intro-overlay"
          className="fixed inset-0 z-[120] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background:
              'radial-gradient(circle at 50% 18%, rgba(234,225,247,0.7), transparent 28%), linear-gradient(180deg, rgba(255,250,247,0.96) 0%, rgba(247,238,244,0.98) 58%, rgba(236,227,240,0.98) 100%)',
          }}
        >
          <CanvaWingAccent className="pointer-events-none absolute top-10 h-40 w-60 text-[color:rgba(90,72,135,0.16)]" />
          <div
            className="pointer-events-none absolute inset-2 rounded-[26px] border"
            style={{
              borderColor: 'color-mix(in srgb, var(--lila-accent) 28%, white)',
              boxShadow: '0 0 44px color-mix(in srgb, var(--lila-accent) 16%, transparent) inset',
            }}
          />

          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0.24 }}
            animate={{ opacity: [0.24, 0.62, 0.28] }}
            transition={{ duration: 1.15, ease: 'easeInOut' }}
            style={{
              background:
                'conic-gradient(from 180deg at 50% 50%, transparent 0deg, color-mix(in srgb, var(--lila-accent) 16%, transparent) 48deg, transparent 96deg, color-mix(in srgb, var(--lila-accent) 12%, transparent) 180deg, transparent 320deg)',
              filter: 'blur(24px)',
            }}
          />

          <motion.div
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: [0, 1, 1], y: [8, 0, -2], scale: [0.92, 1, 1.02] }}
            transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1], times: [0, 0.46, 1] }}
          >
            <BrandLogo
              alt="Soulvio Lila"
              className="h-24 w-24 rounded-full border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-2 shadow-[0_24px_54px_rgba(79,64,122,0.24)]"
            />
            <p className="mt-4 text-[12px] uppercase tracking-[0.34em] text-[var(--lila-text-soft)]">Soulvio Lila</p>
            {isAuthLoading && (
              <div className="mt-4 w-52">
                <p className="text-center text-xs text-[var(--lila-text-muted)]" data-testid="start-intro-loading-label">
                  {loadingLabel ?? 'Синхронізуємо подорож…'}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--lila-surface-muted)]/90">
                  <motion.div
                    className="h-full bg-[var(--lila-accent)] lila-motion-sheen"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.1, ease: 'linear' }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
