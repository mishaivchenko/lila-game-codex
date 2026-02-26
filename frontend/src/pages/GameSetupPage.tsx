import { Link } from 'react-router-dom';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';
import { TelegramRoomsPanel } from '../features/telegram';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';

export const GameSetupPage = () => {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--lila-text-muted)]">Leela</p>
          <h1 className="text-2xl font-semibold text-[var(--lila-text-primary)]">Налаштування подорожі</h1>
        </div>
        <Link to="/" className="text-sm text-[var(--lila-text-muted)] transition hover:text-[var(--lila-text-primary)]">
          Назад
        </Link>
      </header>

      <AppearanceCustomizationPanel className="mb-4" defaultExpanded title="Кастомізуйте гру перед запуском" />

      <JourneySetupHub />
      <div className="mt-5">
        <TelegramRoomsPanel />
      </div>
    </main>
  );
};
