import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import snakeSpiritAsset from '../../assets/lila/snake-spirit.svg';
import { useTelegramAuth } from '../../features/telegram';
import { playCardOpen } from '../../features/telegram/telegramHaptics';
import { consumeTelegramStartParam } from '../../features/telegram/telegramWebApp';
import { IntroOverlay } from './IntroOverlay';

const INTRO_SEEN_KEY = 'lila:start-intro-seen:v1';

const shouldShowIntro = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
};

export const StartPage = () => {
  const navigate = useNavigate();
  const { isTelegramMode, user } = useTelegramAuth();
  const [showIntro, setShowIntro] = useState<boolean>(() => shouldShowIntro());

  useEffect(() => {
    if (!showIntro) {
      return;
    }
    const done = window.setTimeout(() => {
      setShowIntro(false);
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    }, 1600);
    return () => window.clearTimeout(done);
  }, [showIntro]);

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <IntroOverlay visible={showIntro} />
      <motion.section
        className="w-full rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-6 shadow-[0_22px_56px_rgba(42,36,31,0.16)] sm:p-8"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
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
            <img
              src={snakeSpiritAsset}
              alt="Lila symbol"
              className="relative h-20 w-20 rounded-full border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] p-3 shadow-[0_10px_22px_rgba(42,36,31,0.18)]"
            />
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-[var(--lila-text-muted)]">Soulvio Lila</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--lila-text-primary)] sm:text-4xl">Що ви хочете зробити?</h1>
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">{subtitle}</p>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-lg gap-3">
          <button
            type="button"
            onClick={() => {
              playCardOpen();
              navigate('/single');
            }}
            className="group rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-5 py-4 text-left transition hover:border-[var(--lila-accent)] hover:bg-[var(--lila-accent-soft)]"
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
            className="group rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-5 py-4 text-left transition hover:border-[var(--lila-accent)] hover:bg-[var(--lila-accent-soft)]"
          >
            <p className="text-lg font-semibold text-[var(--lila-text-primary)]">Гра з іншими</p>
            <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Створіть або приєднайтесь до спільної подорожі з ведучим.</p>
          </button>
        </div>
      </motion.section>
    </main>
  );
};
