import { Link } from 'react-router-dom';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';

export const GameSetupPage = () => {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-[#f8f6ef] via-[#f2f6ef] to-[#eef2f9] px-4 py-6 sm:px-6">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Leela</p>
          <h1 className="text-2xl font-semibold text-stone-900">Налаштування подорожі</h1>
        </div>
        <Link to="/" className="text-sm text-stone-600 transition hover:text-stone-900">
          Назад
        </Link>
      </header>

      <JourneySetupHub />
    </main>
  );
};
