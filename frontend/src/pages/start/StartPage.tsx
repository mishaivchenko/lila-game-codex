import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { CanvaWingAccent } from '../../components/CanvaWingAccent';
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
      className="lila-page-shell lila-page-shell--center"
      data-boot-phase={bootPhase}
    >
      <IntroOverlay
        visible={overlayVisible}
        phase={bootPhase}
        loadingLabel={bootstrapLabelByState[bootstrapState]}
      />
      <motion.section
        className="lila-panel mx-auto w-full max-w-6xl px-5 py-6 sm:px-7 sm:py-7"
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)', scale: 0.98 }}
        animate={{
          opacity: modeChoiceEnabled ? 1 : 0.84,
          y: 0,
          filter: modeChoiceEnabled ? 'blur(0px)' : 'blur(1.5px)',
          scale: modeChoiceEnabled ? 1 : 0.995,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <CanvaWingAccent className="pointer-events-none absolute -right-10 top-2 hidden h-36 w-56 text-[color:rgba(90,72,135,0.18)] lg:block" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
          <div className="relative">
            <div className="absolute left-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(233,224,247,0.95),transparent_70%)] blur-xl lila-float-orb" aria-hidden="true" />
            <div className="relative mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="lila-badge">Soulvio</span>
                <span className="lila-badge">Telegram Mini App</span>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 lg:justify-start">
                <BrandLogo
                  alt="Lila symbol"
                  className="h-20 w-20 rounded-full border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-2 shadow-[var(--lila-shadow-soft)]"
                />
                <div className="min-w-0">
                  <p className="lila-utility-label">Soulvio Lila</p>
                  <p className="mt-2 text-sm text-[var(--lila-text-muted)]">Calm choices, one focused screen, no extra noise.</p>
                </div>
              </div>
              <h1 className="lila-hero-title mt-6">Що ви хочете зробити?</h1>
              <p className="lila-hero-copy mt-4 max-w-lg">{subtitle}</p>
              <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                <div className="lila-list-card px-4 py-3">
                  <p className="lila-utility-label">Rhythm</p>
                  <p className="mt-2 text-sm text-[var(--lila-text-primary)]">Один екран, чітка ієрархія, м’який темп взаємодії.</p>
                </div>
                <div className="lila-list-card px-4 py-3">
                  <p className="lila-utility-label">Board-first</p>
                  <p className="mt-2 text-sm text-[var(--lila-text-primary)]">Гра лишається центром, а візуал тільки підтримує фокус.</p>
                </div>
              </div>
              {bootPhase === 'BOOT_OFFLINE' && (
                <p className="mt-5 rounded-[22px] border border-amber-300/70 bg-[var(--lila-warning-bg)] px-4 py-3 text-sm text-[var(--lila-warning-text)]">
                  Offline режим: локальна гра доступна, online-кімнати тимчасово вимкнені.
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => {
                playCardOpen();
                navigate('/single');
              }}
              disabled={!modeChoiceEnabled}
              className="lila-action-card group px-5 py-5 text-left disabled:cursor-not-allowed disabled:opacity-70"
            >
              <p className="lila-utility-label">Single Player</p>
              <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--lila-text-primary)]">Одиночна гра</p>
              <p className="mt-2 text-sm text-[var(--lila-text-muted)]">Локальна сесія з персональними нотатками, історією та м’яким стартом.</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="lila-badge">Local session</span>
                <span className="rounded-full bg-[var(--lila-accent)] px-3 py-1.5 text-xs font-medium text-white">Відкрити</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                playCardOpen();
                navigate('/multiplayer');
              }}
              disabled={!modeChoiceEnabled}
              className="lila-action-card group px-5 py-5 text-left disabled:cursor-not-allowed disabled:opacity-70"
            >
              <p className="lila-utility-label">Shared Journey</p>
              <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--lila-text-primary)]">Гра з іншими</p>
              <p className="mt-2 text-sm text-[var(--lila-text-muted)]">Створіть або приєднайтесь до кімнати з ведучим без втрати спокійного ритму гри.</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="lila-badge">Host / Player</span>
                <span className="rounded-full border border-[var(--lila-border-soft)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--lila-text-primary)]">Перейти</span>
              </div>
            </button>
          </div>
        </div>
      </motion.section>
    </main>
  );
};
