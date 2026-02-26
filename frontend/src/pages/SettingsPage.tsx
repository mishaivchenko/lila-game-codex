import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createRepositories } from '../repositories';
import { AppearanceCustomizationPanel } from '../components/AppearanceCustomizationPanel';
import type { DiceMode } from '../domain/types';

const repositories = createRepositories();

export const SettingsPage = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [defaultDiceMode, setDefaultDiceMode] = useState<DiceMode>('classic');

  useEffect(() => {
    void repositories.settingsRepository.getSettings().then((settings) => {
      setSoundEnabled(settings.soundEnabled);
      setMusicEnabled(settings.musicEnabled);
      setDefaultDiceMode(settings.defaultDiceMode);
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

  const persistDiceMode = async (nextMode: DiceMode): Promise<void> => {
    const current = await repositories.settingsRepository.getSettings();
    await repositories.settingsRepository.saveSettings({
      ...current,
      defaultDiceMode: nextMode,
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[var(--lila-bg-main)] px-4 py-5">
      <div className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-4 shadow-[0_12px_30px_rgba(98,76,62,0.1)]">
        <h1 className="text-xl font-semibold">Налаштування подорожі</h1>
        <p className="mt-2 text-sm text-stone-600">Глобальні параметри зберігаються локально в IndexedDB.</p>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Формат кидка</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {([
              { id: 'classic', title: 'Класична', subtitle: '🎲', note: '1 кубик' },
              { id: 'fast', title: 'Швидка', subtitle: '🎲🎲', note: '2 кубики' },
              { id: 'triple', title: 'Питання дня', subtitle: '🎲🎲🎲', note: '3 кубики' },
            ] as const).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setDefaultDiceMode(option.id);
                  void persistDiceMode(option.id);
                }}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  defaultDiceMode === option.id
                    ? 'border-[#c57b5d] bg-[#fff1e8] shadow-[0_8px_24px_rgba(197,123,93,0.18)]'
                    : 'border-stone-200 bg-white hover:border-[#dcc5b7] hover:bg-[#fdf9f5]'
                }`}
              >
                <p className={`text-sm font-semibold ${defaultDiceMode === option.id ? 'text-[#6b4a3b]' : 'text-stone-800'}`}>
                  {option.title}
                </p>
                <p className="mt-1 text-lg leading-none">{option.subtitle}</p>
                <p className={`mt-1 text-xs ${defaultDiceMode === option.id ? 'text-[#8d6b5a]' : 'text-stone-500'}`}>
                  {option.note}
                </p>
              </button>
            ))}
          </div>
        </div>

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
