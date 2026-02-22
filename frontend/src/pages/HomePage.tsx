import { Link } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';

export const HomePage = () => {
  const { resumeLastSession } = useGameContext();

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Lila</h1>
        <p className="mt-2 text-sm text-stone-700">Терапевтична гра самодослідження у спокійному темпі.</p>
        <div className="mt-5 space-y-2">
          <Link to="/setup" className="block rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm text-white">
            Почати нову подорож
          </Link>
          <Link
            to="/game"
            onClick={() => {
              void resumeLastSession();
            }}
            className="block rounded-xl border border-stone-300 px-4 py-3 text-center text-sm text-stone-700"
          >
            Продовжити останню сесію
          </Link>
        </div>
      </section>
    </main>
  );
};
