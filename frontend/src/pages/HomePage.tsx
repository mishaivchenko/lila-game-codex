import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';
import { DeepModeCard } from '../features/deep-mode';

export const HomePage = () => {
  const { resumeLastSession } = useGameContext();
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-[#f8f6ef] via-[#f2f6ef] to-[#eef2f9] px-4 py-6 sm:px-6">
      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_48px_rgba(62,70,58,0.1)]">
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Привіт, люба душа, готова почати свій шлях?</h1>
        <p className="mt-2 text-sm text-stone-600">
          Це простір мʼякого самодослідження. Рухайся у власному темпі.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setShowSetup((prev) => !prev)}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Почати нову гру
          </button>
          <button
            type="button"
            onClick={() => {
              void resumeLastSession().then(() => navigate('/game'));
            }}
            className="rounded-xl border border-stone-300 px-4 py-3 text-center text-sm text-stone-700 transition hover:bg-stone-50"
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

      <section className="mt-5">
        <DeepModeCard />
      </section>
    </main>
  );
};
