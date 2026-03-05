import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { useTelegramAuth } from '../../features/telegram';
import { playCardOpen } from '../../features/telegram/telegramHaptics';
import { consumeTelegramStartParam } from '../../features/telegram/telegramWebApp';
import { resolveAppBootstrapState, bootstrapLabelByState } from '../../features/telegram/ui/bootstrapState';
import { resolveStartBootPhase } from './appBootState';
import { IntroOverlay } from './IntroOverlay';

const INTRO_DURATION_MS = 760;

export const StartPage = () => {
  const navigate = useNavigate();
  const { isTelegramMode, user, status, appStatus, token } = useTelegramAuth();
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const done = window.setTimeout(() => {
      setIntroDone(true);
    }, INTRO_DURATION_MS);
    return () => window.clearTimeout(done);
  }, []);

  useEffect(() => {
    if (!isTelegramMode) {
      return;
    }
    const startParam = consumeTelegramStartParam();
    if (!startParam) {
      return;
    }
    if (startParam.startsWith('room_')) {
      const roomCode = startParam.replace(/^room_/, '').trim().toUpperCase();
      if (roomCode) {
        navigate(`/multiplayer?roomCode=${encodeURIComponent(roomCode)}`, { replace: true });
      }
      return;
    }
    if (startParam.startsWith('roomid_')) {
      const roomId = startParam.replace(/^roomid_/, '').trim();
      if (roomId) {
        navigate(`/multiplayer?roomId=${encodeURIComponent(roomId)}`, { replace: true });
      }
    }
  }, [isTelegramMode, navigate]);

  const subtitle = useMemo(
    () => (isTelegramMode && user
      ? `Вітаємо, ${user.displayName}. Оберіть формат подорожі.`
      : 'Оберіть, як ви хочете розпочати практику сьогодні.'),
    [isTelegramMode, user],
  );
  const bootstrapState = resolveAppBootstrapState(status, appStatus, Boolean(token));
  const bootPhase = resolveStartBootPhase({
    introDone,
    isTelegramMode,
    authStatus: status,
    appStatus,
  });
  const overlayVisible = bootPhase === 'BOOT_SPLASH' || bootPhase === 'BOOT_AUTH_LOADING';
  const modeChoiceEnabled = bootPhase === 'BOOT_READY' || bootPhase === 'BOOT_OFFLINE';

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-3xl items-center bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6"
      data-boot-phase={bootPhase}
    >
      <IntroOverlay
        visible={overlayVisible}
        phase={bootPhase}
        loadingLabel={bootstrapLabelByState[bootstrapState]}
      />
      <motion.section
        className="w-full rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-6 shadow-[0_22px_56px_rgba(42,36,31,0.16)] sm:p-8"
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)', scale: 0.98 }}
        animate={{
          opacity: modeChoiceEnabled ? 1 : 0.84,
          y: 0,
          filter: modeChoiceEnabled ? 'blur(0px)' : 'blur(1.5px)',
          scale: modeChoiceEnabled ? 1 : 0.995,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, color-mix(in srgb, var(--lila-accent) 28%, transparent), transparent 72%)',
                transform: 'scale(1.34)',
              }}
              aria-hidden="true"
            />
            <BrandLogo
              alt="Lila symbol"
              className="relative h-20 w-20 rounded-full border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] p-2 shadow-[0_10px_22px_rgba(42,36,31,0.18)]"
            />
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-[var(--lila-text-muted)]">Soulvio Lila</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--lila-text-primary)] sm:text-4xl">Що ви хочете зробити?</h1>
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">{subtitle}</p>
          {bootPhase === 'BOOT_OFFLINE' && (
            <p className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
              Offline режим: локальна гра доступна, online-кімнати тимчасово вимкнені.
            </p>
          )}
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-lg gap-3">
          <button
            type="button"
            onClick={() => {
              playCardOpen();
              navigate('/single');
            }}
            disabled={!modeChoiceEnabled}
            className="group rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-5 py-4 text-left transition hover:border-[var(--lila-accent)] hover:bg-[var(--lila-accent-soft)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <p className="text-lg font-semibold text-[var(--lila-text-primary)]">Одиночна гра</p>
            <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Локальна сесія з персональними нотатками та історією.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              playCardOpen();
              navigate('/multiplayer');
            }}
            disabled={!modeChoiceEnabled}
            className="group rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-5 py-4 text-left transition hover:border-[var(--lila-accent)] hover:bg-[var(--lila-accent-soft)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <p className="text-lg font-semibold text-[var(--lila-text-primary)]">Гра з іншими</p>
            <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Створіть або приєднайтесь до спільної подорожі з ведучим.</p>
          </button>
        </div>
      </motion.section>
    </main>
  );
};
