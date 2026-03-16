import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import { CanvaWingAccent } from '../components/CanvaWingAccent';
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
      <div className="lila-panel mx-auto w-full max-w-3xl px-5 py-5 sm:px-6">
        <CanvaWingAccent className="pointer-events-none absolute -right-10 top-0 hidden h-32 w-48 text-[color:rgba(90,72,135,0.18)] md:block" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lila-utility-label">Settings</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--lila-text-primary)]">Налаштування подорожі</h1>
            <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Глобальні параметри зберігаються локально в IndexedDB.</p>
          </div>
          <Link className="lila-secondary-button px-4 py-2 text-sm font-medium" to="/game">
            До гри
          </Link>
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
