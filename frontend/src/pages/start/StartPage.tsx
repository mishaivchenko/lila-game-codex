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
        className="lila-canva-frame mx-auto w-full max-w-[1480px]"
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)', scale: 0.98 }}
        animate={{
          opacity: modeChoiceEnabled ? 1 : 0.84,
          y: 0,
          filter: modeChoiceEnabled ? 'blur(0px)' : 'blur(1.5px)',
          scale: modeChoiceEnabled ? 1 : 0.995,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <CanvaWingAccent className="pointer-events-none absolute right-8 top-6 hidden h-44 w-72 text-[color:rgba(90,72,135,0.18)] lg:block" />

        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.18fr)_360px] xl:grid-cols-[minmax(0,1.12fr)_400px]">
          <section className="lila-poster-panel flex min-h-0 flex-col justify-between px-5 py-5 sm:px-7 sm:py-7">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="lila-badge">Soulvio</span>
                  <span className="lila-badge">Telegram Mini App</span>
                </div>
                <p className="lila-utility-label text-right">Desktop-inspired Canva adaptation</p>
              </div>

              <div className="lila-editorial-divider mt-5" />

              <div className="mt-6 grid gap-6 lg:grid-cols-[148px_minmax(0,1fr)] lg:items-start">
                <div className="relative flex justify-center lg:justify-start">
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,224,247,0.95),transparent_70%)] blur-xl lila-float-orb"
                  />
                  <BrandLogo
                    alt="Lila symbol"
                    className="relative z-[1] h-24 w-24 rounded-full border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-3 shadow-[var(--lila-shadow-soft)]"
                  />
                </div>

                <div className="text-center lg:text-left">
                  <p className="lila-utility-label">Soulvio Lila</p>
                  <h1 className="lila-poster-title mt-4">Твій простір для чесних відповідей</h1>
                  <p className="lila-poster-copy mt-5 max-w-2xl">
                    {subtitle}
                    {' '}
                    Головний екран тепер поводиться як компактна poster-композиція з Canva: виразний заголовок, м’які editorial
                    surfaces і чітка точка входу в гру.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="lila-canva-stat-grid text-left">
                <div className="lila-paper-card px-4 py-4">
                  <p className="lila-utility-label">Rhythm</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">
                    Один екран, чітка ієрархія, м’який темп взаємодії.
                  </p>
                </div>
                <div className="lila-paper-card px-4 py-4">
                  <p className="lila-utility-label">Board-first</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">
                    Гра лишається центром, а декор не забирає фокус.
                  </p>
                </div>
                <div className="lila-paper-card px-4 py-4">
                  <p className="lila-utility-label">Responsive</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">
                    Desktop дихає шириною, mobile не втрачає темпу й читабельності.
                  </p>
                </div>
              </div>

              {bootPhase === 'BOOT_OFFLINE' && (
                <p className="mt-5 rounded-[22px] border border-amber-300/70 bg-[var(--lila-warning-bg)] px-4 py-3 text-sm text-[var(--lila-warning-text)]">
                  Offline режим: локальна гра доступна, online-кімнати тимчасово вимкнені.
                </p>
              )}
            </div>
          </section>

          <aside className="lila-canva-sidebar flex min-h-0 flex-col p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
              <div>
                <p className="lila-utility-label">Choose Mode</p>
                <p className="mt-2 text-lg font-semibold text-[var(--lila-text-primary)]">Що ви хочете зробити?</p>
              </div>
              <span className="lila-badge">2 входи</span>
            </div>

            <div className="lila-editorial-divider mb-4" />

            <div className="lila-canva-actions flex-1">
              <button
                type="button"
                onClick={() => {
                  playCardOpen();
                  navigate('/single');
                }}
                disabled={!modeChoiceEnabled}
                className="lila-canva-action group disabled:cursor-not-allowed disabled:opacity-70"
              >
                <p className="lila-utility-label">Single Player</p>
                <p className="text-[1.9rem] font-black tracking-[-0.05em] text-[var(--lila-text-primary)]">Одиночна гра</p>
                <p className="text-sm leading-6 text-[var(--lila-text-muted)]">
                  Локальна сесія з персональними нотатками, історією та м’яким стартом.
                </p>
                <div className="flex items-center justify-between gap-3">
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
                className="lila-canva-action group disabled:cursor-not-allowed disabled:opacity-70"
              >
                <p className="lila-utility-label">Shared Journey</p>
                <p className="text-[1.9rem] font-black tracking-[-0.05em] text-[var(--lila-text-primary)]">Гра з іншими</p>
                <p className="text-sm leading-6 text-[var(--lila-text-muted)]">
                  Створіть або приєднайтесь до кімнати з ведучим без втрати спокійного ритму гри.
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="lila-badge">Host / Player</span>
                  <span className="rounded-full border border-[var(--lila-border-soft)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--lila-text-primary)]">Перейти</span>
                </div>
              </button>
            </div>

            <div className="mt-4 rounded-[26px] bg-[linear-gradient(180deg,rgba(233,224,247,0.66),rgba(255,255,255,0.44))] px-4 py-4">
              <p className="lila-utility-label">Design Direction</p>
              <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">
                Більше схоже на desktop-макет Canva, але без втрати mobile-first керованості всередині Telegram.
              </p>
            </div>
          </aside>
        </div>
      </motion.section>
    </main>
  );
};
