import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { CanvaBirdAccent } from '../components/CanvaBirdAccent';
import { CanvaPageTopBar } from '../components/CanvaPageTopBar';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';

export const GameSetupPage = () => {
  return (
    <main className="lila-page-shell">
      <div className="lila-canva-frame min-h-0 flex-1">
        <CanvaPageTopBar backHref="/" />

        <div className="grid min-h-0 flex-1 gap-4 pt-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="relative min-h-0 px-2 text-center sm:px-4 lg:text-left">
            <CanvaBirdAccent className="pointer-events-none absolute -left-10 top-24 hidden h-44 w-52 text-[color:rgba(179,168,216,0.42)] lg:block" />

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

              <AppearanceCustomizationPanel className="mt-6" defaultExpanded title="Кастомізуйте гру перед запуском" />
            </div>
          </section>

          <div className="lila-scroll-pane pr-1">
            <JourneySetupHub />
          </div>
        </div>
      </div>
    </main>
  );
};
