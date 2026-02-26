import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createRepositories } from '../repositories';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';

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
    <main className="mx-auto min-h-screen max-w-lg bg-[var(--lila-bg-main)] px-4 py-5">
      <div className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-4 shadow-[0_12px_30px_rgba(98,76,62,0.1)]">
        <h1 className="text-xl font-semibold">Налаштування подорожі</h1>
        <p className="mt-2 text-sm text-stone-600">Глобальні параметри зберігаються локально в IndexedDB.</p>

        <div className="mt-4 space-y-2 text-sm text-stone-700">
          <label className="flex items-center justify-between rounded-xl border border-stone-200 p-3">
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
          <label className="flex items-center justify-between rounded-xl border border-stone-200 p-3">
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
        <Link className="mt-4 inline-block text-sm text-[#9b6d57]" to="/game">
          Повернутися до гри
        </Link>
      </div>
    </main>
  );
};
