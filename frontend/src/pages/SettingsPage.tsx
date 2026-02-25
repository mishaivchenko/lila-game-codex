import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createRepositories } from '../repositories';
import { useBoardTheme } from '../theme';

const repositories = createRepositories();

export const SettingsPage = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const {
    themeId,
    theme,
    themes,
    tokenColorId,
    animationSpeed,
    setThemeId,
    setTokenColorId,
    setAnimationSpeed,
  } = useBoardTheme();

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
        <h1 className="text-xl font-semibold">Налаштування</h1>
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

        <div className="mt-5">
          <p className="text-sm font-medium text-stone-700">Оформлення дошки</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {themes.map((themeOption) => (
              <button
                key={themeOption.id}
                type="button"
                onClick={() => setThemeId(themeOption.id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  themeId === themeOption.id
                    ? 'border-[#c57b5d] bg-[#f9ece3] text-[#6b4a3b]'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-[#d3baa9]'
                }`}
              >
                <span className="block font-medium">{themeOption.name}</span>
                <span className="mt-1 flex gap-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: themeOption.snake.coreGradientStops[0] }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: themeOption.stairs.railGradientStops[0] }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: themeOption.token.defaultColor }}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-stone-700">Колір фішки</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {theme.token.palette.map((token) => (
              <button
                key={token.id}
                type="button"
                onClick={() => setTokenColorId(token.id)}
                className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition ${
                  tokenColorId === token.id
                    ? 'border-[#c57b5d] bg-[#f9ece3] text-[#6b4a3b]'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: token.value }} />
                {token.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-stone-700">Швидкість анімацій</p>
          <div className="mt-2 inline-flex rounded-full border border-stone-200 bg-white p-1">
            {(['slow', 'normal', 'fast'] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setAnimationSpeed(speed)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  animationSpeed === speed ? 'bg-[#f1dfd2] text-[#6b4a3b]' : 'text-stone-600'
                }`}
              >
                {speed === 'slow' ? 'Повільно' : speed === 'normal' ? 'Нормально' : 'Швидко'}
              </button>
            ))}
          </div>
        </div>
        <Link className="mt-4 inline-block text-sm text-[#9b6d57]" to="/game">
          Повернутися до гри
        </Link>
      </div>
    </main>
  );
};
