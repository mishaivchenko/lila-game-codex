import { BrandLogo } from '../components/BrandLogo';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { CanvaPageTopBar } from '../components/CanvaPageTopBar';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';

export const GameSetupPage = () => {
  return (
    <main className="lila-page-shell">
      <div className="lila-canva-frame min-h-0 flex-1">
        <CanvaPageTopBar backHref="/" />

        <div className="grid min-h-0 flex-1 gap-4 pt-5 min-[1460px]:grid-cols-[340px_minmax(0,1fr)]">
          <section className="relative min-h-0 px-2 text-center sm:px-4 lg:text-left">
            <BrandLogo
              alt="SoulVio Ліла"
              className="pointer-events-none absolute -left-10 top-20 hidden h-40 w-40 opacity-[var(--lila-brand-mark-opacity)] lg:block"
            />

            <div className="mx-auto max-w-[760px] lg:mx-0">
              <h1 className="lila-canva-stage-title mt-2">Створи свою реальність на цю гру</h1>
              <p className="lila-canva-stage-copy mt-4 max-w-[620px] lg:max-w-[640px]">
                Підготуй тему, вигляд і глибину проходження так, щоб mobile лишився зручним, а desktop не виглядав затиснутим.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="lila-canva-action px-4 py-4 text-center sm:text-left">
                  <p className="text-base font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">Проста гра</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">Експрес-діагностика твого стану.</p>
                </div>
                <div className="lila-canva-action px-4 py-4 text-center sm:text-left">
                  <p className="text-base font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">Глибока гра</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">Глибока робота з підсвідомістю.</p>
                </div>
                <div className="lila-canva-action px-4 py-4 text-center sm:text-left">
                  <p className="text-base font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">Питання дня</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">Швидкий вхід у практику без перевантаження.</p>
                </div>
              </div>

              <AppearanceCustomizationPanel className="mt-6" defaultExpanded={false} title="Кастомізуйте гру перед запуском" />
            </div>
          </section>

          <div className="min-h-0 pr-1">
            <JourneySetupHub />
          </div>
        </div>
      </div>
    </main>
  );
};
