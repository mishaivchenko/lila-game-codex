import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';

export const HomePage = () => {
  const { resumeLastSession } = useGameContext();
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/90 p-6 shadow-[0_20px_48px_rgba(98,76,62,0.12)]">
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Привіт, люба душа, готова почати свій шлях?</h1>
        <p className="mt-2 text-sm text-[var(--lila-text-muted)]">
          Це простір мʼякого самодослідження. Рухайся у власному темпі.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setShowSetup((prev) => !prev)}
            className="rounded-xl bg-[var(--lila-accent)] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[var(--lila-accent-hover)]"
          >
            Почати нову гру
          </button>
          <button
            type="button"
            onClick={() => {
              void resumeLastSession().then(() => navigate('/game'));
            }}
            className="rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-4 py-3 text-center text-sm text-[var(--lila-text-primary)] transition hover:bg-[var(--lila-surface-muted)]"
          >
            Продовжити гру
          </button>
        </div>

        {!showSetup && (
          <Link to="/setup" className="mt-3 inline-block text-xs text-stone-500 underline underline-offset-2">
            Відкрити налаштування на окремій сторінці
          </Link>
        )}
      </section>

      {showSetup && <JourneySetupHub />}
    </main>
  );
};
