import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import snakeSpiritAsset from '../../assets/lila/snake-spirit.svg';
import { useTelegramAuth } from '../../features/telegram';
import { consumeTelegramStartParam } from '../../features/telegram/telegramWebApp';

const containerTransition = { duration: 0.36, ease: [0.22, 1, 0.36, 1] } as const;

export const StartPage = () => {
  const navigate = useNavigate();
  const { isTelegramMode, user } = useTelegramAuth();

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <motion.section
        className="w-full rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-6 shadow-[0_22px_56px_rgba(42,36,31,0.16)] sm:p-8"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={containerTransition}
      >
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...containerTransition, delay: 0.04 }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(217, 168, 103, 0.26), transparent 72%)',
                transform: 'scale(1.34)',
              }}
              aria-hidden="true"
            />
            <img
              src={snakeSpiritAsset}
              alt="Lila symbol"
              className="relative h-20 w-20 rounded-full border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] p-3 shadow-[0_10px_22px_rgba(42,36,31,0.18)]"
            />
          </motion.div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-[var(--lila-text-muted)]">Lila Journey</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--lila-text-primary)] sm:text-4xl">Оберіть формат подорожі</h1>
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">
            {isTelegramMode && user
              ? `Вітаємо, ${user.displayName}. Продовжимо у вашому темпі.`
              : 'Почніть власну практику або відкрийте кімнату для спільного досвіду.'}
          </p>
        </div>

        <motion.div
          className="mx-auto mt-8 grid w-full max-w-lg gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...containerTransition, delay: 0.12 }}
        >
          <button
            type="button"
            onClick={() => navigate('/single')}
            className="group rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-5 py-4 text-left transition hover:border-[var(--lila-accent)] hover:bg-[var(--lila-accent-soft)]"
          >
            <p className="text-lg font-semibold text-[var(--lila-text-primary)]">Одиночна гра</p>
            <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Локальна сесія, історія ходів та особисті нотатки.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/multiplayer')}
            className="group rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-5 py-4 text-left transition hover:border-[var(--lila-accent)] hover:bg-[var(--lila-accent-soft)]"
          >
            <p className="text-lg font-semibold text-[var(--lila-text-primary)]">Гра з іншими</p>
            <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Host Room, коди запрошення та відновлення групових сесій.</p>
          </button>
        </motion.div>
      </motion.section>
    </main>
  );
};
