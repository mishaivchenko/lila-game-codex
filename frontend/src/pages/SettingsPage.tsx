import { useEffect, useState } from 'react';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { CanvaBirdAccent } from '../components/CanvaBirdAccent';
import { CanvaPageTopBar } from '../components/CanvaPageTopBar';
import { createRepositories } from '../repositories';

const repositories = createRepositories();

export const SettingsPage = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

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
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <CanvaPageTopBar backHref="/game" backLabel="До гри" />

        <div className="relative mt-5 px-2 sm:px-4">
          <CanvaBirdAccent className="pointer-events-none absolute -right-10 top-0 hidden h-40 w-48 text-[color:rgba(179,168,216,0.34)] lg:block" />
          <p className="lila-utility-label">Settings</p>
          <h1 className="lila-canva-stage-title mt-2">Налаштування подорожі</h1>
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Глобальні параметри зберігаються локально в IndexedDB.</p>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-[var(--lila-text-primary)] sm:grid-cols-2">
          <label className="lila-list-card flex items-center justify-between px-4 py-4">
            Звук
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
          <label className="lila-list-card flex items-center justify-between px-4 py-4">
            Музика
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

        <AppearanceCustomizationPanel className="mt-5" defaultExpanded title="Вигляд і анімації" />
      </div>
    </main>
  );
};
