import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { CanvaPageTopBar } from '../../components/CanvaPageTopBar';
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
    () => (
      isTelegramMode && user
        ? `Вітаємо, ${user.displayName}. Оберіть формат подорожі.`
        : 'Оберіть, як ви хочете розпочати практику сьогодні.'
    ),
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
    <main className="lila-page-shell lila-page-shell--center" data-boot-phase={bootPhase}>
      <IntroOverlay
        visible={overlayVisible}
        phase={bootPhase}
        loadingLabel={bootstrapLabelByState[bootstrapState]}
      />

      <motion.section
        className="lila-canva-frame mx-auto flex h-full w-full max-w-[1240px] flex-1"
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)', scale: 0.98 }}
        animate={{
          opacity: modeChoiceEnabled ? 1 : 0.84,
          y: 0,
          filter: modeChoiceEnabled ? 'blur(0px)' : 'blur(1.5px)',
          scale: modeChoiceEnabled ? 1 : 0.995,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <CanvaPageTopBar />

          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-2 pb-4 pt-6 text-center sm:px-4">
            <BrandLogo
              alt="SoulVio Ліла"
              className="h-28 w-28 opacity-95 drop-shadow-[0_10px_22px_rgba(98,85,154,0.18)] sm:h-32 sm:w-32"
            />

            <div className="mx-auto mt-6 max-w-[860px]">
              <p className="text-sm text-[var(--lila-text-muted)]">Вітаємо в SoulVio Ліла</p>
              <h1 className="lila-poster-title mt-3">Твій простір для чесних відповідей</h1>
              <p className="lila-canva-stage-copy mx-auto mt-4 max-w-[640px]">
                {subtitle}
              </p>
            </div>

            <div className="mt-8 grid w-full max-w-[560px] gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  playCardOpen();
                  navigate('/single');
                }}
                disabled={!modeChoiceEnabled}
                className="lila-primary-button min-h-[68px] px-5 py-4 text-sm font-black uppercase tracking-[-0.02em] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Я - гравець
                <span className="mt-1 block text-xs font-medium normal-case tracking-normal text-[var(--lila-text-muted)]">
                  Одиночна гра
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playCardOpen();
                  navigate('/multiplayer');
                }}
                disabled={!modeChoiceEnabled}
                className="lila-primary-button min-h-[68px] px-5 py-4 text-sm font-black uppercase tracking-[-0.02em] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Я - провідник
                <span className="mt-1 block text-xs font-medium normal-case tracking-normal text-[var(--lila-text-muted)]">
                  Гра з іншими
                </span>
              </button>
            </div>

            {bootPhase === 'BOOT_OFFLINE' && (
              <p className="mt-6 max-w-[560px] rounded-[18px] border border-amber-300/60 bg-[var(--lila-warning-bg)]/90 px-4 py-3 text-sm text-[var(--lila-warning-text)]">
                Offline режим: локальна гра доступна, online-кімнати тимчасово вимкнені.
              </p>
            )}
          </div>
        </div>
      </motion.section>
    </main>
  );
};
