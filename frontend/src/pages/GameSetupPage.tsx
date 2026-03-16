import { Link } from 'react-router-dom';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { CanvaWingAccent } from '../components/CanvaWingAccent';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';

export const GameSetupPage = () => {
  return (
    <main className="lila-page-shell">
      <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <section className="lila-panel px-5 py-5 sm:px-6">
          <CanvaWingAccent className="pointer-events-none absolute -right-10 top-0 hidden h-32 w-48 text-[color:rgba(90,72,135,0.18)] md:block" />
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="lila-utility-label">Journey Setup</p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--lila-text-primary)] sm:text-4xl">Налаштування подорожі</h1>
              <p className="mt-3 max-w-md text-sm text-[var(--lila-text-muted)]">
                Обери ритм, стиль та формат гри. Все залишається на одному екрані без втрати фокусу на самій подорожі.
              </p>
            </div>
            <Link to="/" className="lila-secondary-button px-4 py-2 text-sm font-medium">
              Назад
            </Link>
          </header>

          <AppearanceCustomizationPanel className="mt-6" defaultExpanded title="Кастомізуйте гру перед запуском" />
        </section>

        <div className="lila-scroll-pane pr-1">
          <JourneySetupHub />
        </div>
      </div>
    </main>
  );
};
