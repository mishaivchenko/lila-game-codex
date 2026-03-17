import { Link } from 'react-router-dom';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { CanvaWingAccent } from '../components/CanvaWingAccent';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';

export const GameSetupPage = () => {
  return (
    <main className="lila-page-shell">
      <div className="lila-canva-frame min-h-0">
        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="lila-poster-panel px-5 py-5 sm:px-6">
            <CanvaWingAccent className="pointer-events-none absolute -right-10 top-0 hidden h-32 w-48 text-[color:rgba(90,72,135,0.18)] md:block" />

            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="lila-utility-label">Journey Setup</p>
                <h1 className="lila-poster-title mt-4 max-w-3xl">Налаштування подорожі в стилі редакційного постера</h1>
                <p className="lila-poster-copy mt-4 max-w-2xl">
                  Setup тепер виглядає ближче до desktop-макета Canva: виразний вступний блок, окрема poster-сцена для
                  кастомізації й компактний хаб запуску гри поруч.
                </p>
              </div>
              <Link to="/" className="lila-secondary-button px-4 py-2 text-sm font-medium">
                Назад
              </Link>
            </header>

            <div className="lila-editorial-divider mt-5" />

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Theme</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Кольори, фішки й настрій шляху перед стартом.</p>
              </div>
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Mode</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Проста гра, правила та майбутній deep flow в одному shell.</p>
              </div>
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Screen Use</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Desktop отримує повітря, mobile не втрачає одного екрана.</p>
              </div>
            </div>

            <AppearanceCustomizationPanel className="mt-6" defaultExpanded title="Кастомізуйте гру перед запуском" />
          </section>

          <div className="lila-scroll-pane pr-1">
            <JourneySetupHub />
          </div>
        </div>
      </div>
    </main>
  );
};
