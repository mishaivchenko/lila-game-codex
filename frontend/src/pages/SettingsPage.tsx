import { useEffect, useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { CanvaPageTopBar } from '../components/CanvaPageTopBar';
import { CompactPanelModal } from '../components/CompactPanelModal';
import { createRepositories } from '../repositories';

const repositories = createRepositories();

export const SettingsPage = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

  useEffect(() => {
    void repositories.settingsRepository.getSettings().then((settings) => {
      setSoundEnabled(settings.soundEnabled);
      setMusicEnabled(settings.musicEnabled);
    });
  }, []);

  const persist = async (next: { soundEnabled: boolean; musicEnabled: boolean }): Promise<void> => {
    const current = await repositories.settingsRepository.getSettings();
    await repositories.settingsRepository.saveSettings({
      ...current,
      soundEnabled: next.soundEnabled,
      musicEnabled: next.musicEnabled,
    });
  };

  return (
    <main className="lila-page-shell lila-page-shell--center">
      <div className="lila-canva-frame mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <CanvaPageTopBar backHref="/game" backLabel="До гри" />

        <section className="lila-panel relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:mt-5 sm:p-6">
          <BrandLogo
            alt="SoulVio Ліла"
            className="pointer-events-none absolute -right-10 top-4 hidden h-36 w-36 opacity-[var(--lila-brand-mark-opacity)] lg:block"
          />

          <div className="relative z-[1]">
            <p className="lila-utility-label">Settings</p>
            <h1 className="lila-canva-stage-title mt-2">Налаштування подорожі</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--lila-text-muted)]">
              Лише базові перемикачі й окремий вхід до візуальних налаштувань, без стрибків макета після відкриття сторінки.
            </p>
          </div>

          <div className="mt-6 grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-3 text-sm text-[var(--lila-text-primary)] sm:grid-cols-2">
              <label className="lila-list-card flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-base font-semibold text-[var(--lila-text-primary)]">Звук</p>
                  <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Підказки, кліки та звукові сигнали всередині гри.</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(event) => {
                    const next = { soundEnabled: event.target.checked, musicEnabled };
                    setSoundEnabled(next.soundEnabled);
                    void persist(next);
                  }}
                />
              </label>
              <label className="lila-list-card flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-base font-semibold text-[var(--lila-text-primary)]">Музика</p>
                  <p className="mt-1 text-sm text-[var(--lila-text-muted)]">Фонова атмосфера для сесії та пауз між ходами.</p>
                </div>
                <input
                  type="checkbox"
                  checked={musicEnabled}
                  onChange={(event) => {
                    const next = { soundEnabled, musicEnabled: event.target.checked };
                    setMusicEnabled(next.musicEnabled);
                    void persist(next);
                  }}
                />
              </label>
            </div>

            <section className="lila-list-card flex h-fit flex-col p-4">
              <p className="lila-utility-label">Appearance Studio</p>
              <h2 className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Вигляд і анімації</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">
                Тема, фішка, стилі шляху й формат кидка відкриваються в окремому модальному вікні.
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
      </div>

      <CompactPanelModal
        open={showAppearanceModal}
        eyebrow="Appearance Studio"
        title="Вигляд і анімації"
        onClose={() => setShowAppearanceModal(false)}
      >
        <AppearanceCustomizationPanel defaultExpanded title="Вигляд і анімації" />
      </CompactPanelModal>
    </main>
  );
};
