import { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { CanvaPageTopBar } from '../components/CanvaPageTopBar';
import { CompactPanelModal } from '../components/CompactPanelModal';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';

export const GameSetupPage = () => {
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

  return (
    <main className="lila-page-shell">
      <div className="lila-canva-frame min-h-0 flex-1">
        <CanvaPageTopBar backHref="/" />

        <div
          className="grid min-h-0 flex-1 gap-3 pt-3 grid-rows-[auto_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] xl:grid-rows-1 xl:gap-4 xl:pt-4"
          data-testid="setup-shell-layout"
        >
          <section className="xl:hidden lila-panel-muted px-4 py-3 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="lila-utility-label">Journey Studio</p>
                <h1 className="mt-2 text-[clamp(1.6rem,6vw,2.5rem)] font-black uppercase tracking-[-0.05em] text-[var(--lila-text-primary)]">
                  Старт гри
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setShowAppearanceModal(true)}
                className="lila-secondary-button px-3 py-2 text-sm font-medium"
              >
                Вигляд
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="lila-badge">Проста гра</span>
              <span className="lila-badge">До 4 учасників</span>
              <span className="lila-badge">Без scroll</span>
            </div>
          </section>

          <section className="hidden xl:block lila-canva-sidebar relative min-h-0 px-4 py-3 text-left sm:px-5 sm:py-4">
            <BrandLogo
              alt="SoulVio Ліла"
              className="pointer-events-none absolute -right-8 top-4 hidden h-32 w-32 opacity-[var(--lila-brand-mark-opacity)] xl:block"
            />

            <div className="mx-auto max-w-[760px] xl:mx-0">
              <p className="lila-utility-label">Journey Studio</p>
              <h1 className="mt-2 text-[clamp(2rem,4vw,3.6rem)] font-black uppercase tracking-[-0.05em] text-[var(--lila-text-primary)]">
                Старт гри
              </h1>
              <p className="mt-3 hidden max-w-[32rem] text-sm leading-6 text-[var(--lila-text-muted)] sm:block">
                Залишаємо лише потрібне: формат входу, гравці, тема й старт без зайвого шуму.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="lila-badge">Проста гра</span>
                <span className="lila-badge">До 4 учасників</span>
                <span className="lila-badge">Один екран</span>
              </div>

              <section className="lila-list-card mt-4 p-4">
                <p className="lila-utility-label">Appearance Studio</p>
                <h2 className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Тема та вигляд</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">
                  Відкривається окремо, щоб правила та стартовий екран залишалися спокійними й читабельними.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAppearanceModal(true)}
                  className="lila-secondary-button mt-4 w-full px-4 py-3 text-sm font-medium"
                >
                  Відкрити appearance studio
                </button>
              </section>
            </div>
          </section>

          <div className="min-h-0 xl:pr-1">
            <JourneySetupHub onOpenAppearanceStudio={() => setShowAppearanceModal(true)} />
          </div>
        </div>
      </div>

      <CompactPanelModal
        open={showAppearanceModal}
        eyebrow="Appearance Studio"
        title="Тема та вигляд"
        onClose={() => setShowAppearanceModal(false)}
      >
        <AppearanceCustomizationPanel defaultExpanded title="Тема та вигляд" />
      </CompactPanelModal>
    </main>
  );
};
