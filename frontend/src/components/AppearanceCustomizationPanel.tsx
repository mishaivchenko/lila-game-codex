import { useEffect, useMemo, useState } from 'react';
import {
  SNAKE_COLOR_OPTIONS,
  SNAKE_STYLE_OPTIONS,
  STAIRS_COLOR_OPTIONS,
  STAIRS_STYLE_OPTIONS,
  useBoardTheme,
} from '../theme';
import { createRepositories } from '../repositories';
import type { DiceMode } from '../domain/types';

interface AppearanceCustomizationPanelProps {
  className?: string;
  defaultExpanded?: boolean;
  title?: string;
}

const repositories = createRepositories();

const diceModeOptions: Array<{
  id: DiceMode;
  title: string;
  emoji: string;
  note: string;
}> = [
  { id: 'classic', title: 'Класична', emoji: '🎲', note: '1 кубик' },
  { id: 'fast', title: 'Швидка', emoji: '🎲🎲', note: '2 кубики' },
  { id: 'triple', title: 'Питання дня', emoji: '🎲🎲🎲', note: '3 кубики' },
];

export const AppearanceCustomizationPanel = ({
  className,
  defaultExpanded = false,
  title = 'Кастомізація вигляду',
}: AppearanceCustomizationPanelProps) => {
  const {
    themeId,
    themes,
    tokenColorId,
    snakeStyleId,
    snakeColorId,
    stairsStyleId,
    stairsColorId,
    setThemeId,
    setTokenColorId,
    setSnakeStyleId,
    setSnakeColorId,
    setStairsStyleId,
    setStairsColorId,
    theme,
  } = useBoardTheme();

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [defaultDiceMode, setDefaultDiceMode] = useState<DiceMode>('classic');

  const tokenOptions = useMemo(() => theme.token.palette, [theme.token.palette]);

  useEffect(() => {
    let cancelled = false;
    void repositories.settingsRepository.getSettings().then((settings) => {
      if (!cancelled) {
        setDefaultDiceMode(settings.defaultDiceMode);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyDiceMode = async (mode: DiceMode): Promise<void> => {
    setDefaultDiceMode(mode);
    const current = await repositories.settingsRepository.getSettings();
    await repositories.settingsRepository.saveSettings({
      ...current,
      defaultDiceMode: mode,
    });
  };

  return (
    <section className={`rounded-2xl border border-[#ead9cc] bg-[var(--lila-surface)]/92 p-4 shadow-[0_12px_28px_rgba(98,76,62,0.1)] ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8b6f60]">Appearance Studio</p>
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        </div>
        <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600">
          {expanded ? 'Згорнути' : 'Розгорнути'}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Формат кидка</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {diceModeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    void applyDiceMode(option.id);
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
                  <p className="mt-1 text-lg leading-none">{option.emoji}</p>
                  <p className={`mt-1 text-xs ${defaultDiceMode === option.id ? 'text-[#8d6b5a]' : 'text-stone-500'}`}>
                    {option.note}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Тема</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  type="button"
                  onClick={() => setThemeId(themeOption.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    themeId === themeOption.id
                      ? 'border-[#c57b5d] bg-[#f8ebe2] text-[#6b4a3b]'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {themeOption.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Фішка</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tokenOptions.map((token) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => setTokenColorId(token.id)}
                  className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${
                    tokenColorId === token.id
                      ? 'border-[#c57b5d] bg-[#f8ebe2] text-[#6b4a3b]'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: token.value }} />
                  {token.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Стиль змії</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SNAKE_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSnakeStyleId(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    snakeStyleId === option.id
                      ? 'border-[#c57b5d] bg-[#f8ebe2] text-[#6b4a3b]'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SNAKE_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSnakeColorId(option.id)}
                  className={`h-7 w-7 rounded-full border-2 ${snakeColorId === option.id ? 'scale-110 border-[#6b4a3b]' : 'border-white'}`}
                  style={{ backgroundColor: option.preview }}
                  aria-label={option.label}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Стиль сходів/стріл</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STAIRS_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStairsStyleId(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    stairsStyleId === option.id
                      ? 'border-[#c57b5d] bg-[#f8ebe2] text-[#6b4a3b]'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {STAIRS_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStairsColorId(option.id)}
                  className={`h-7 w-7 rounded-full border-2 ${stairsColorId === option.id ? 'scale-110 border-[#6b4a3b]' : 'border-white'}`}
                  style={{ backgroundColor: option.preview }}
                  aria-label={option.label}
                  title={option.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
