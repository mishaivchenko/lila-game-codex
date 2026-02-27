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
    <section className={`rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-4 shadow-[0_12px_28px_rgba(98,76,62,0.1)] ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Appearance Studio</p>
          <h3 className="text-sm font-semibold text-[var(--lila-text-primary)]">{title}</h3>
        </div>
        <span className="rounded-full border border-[var(--lila-chip-border)] bg-[var(--lila-chip-bg)] px-3 py-1 text-xs text-[var(--lila-chip-text)]">
          {expanded ? 'Згорнути' : 'Розгорнути'}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 grid max-h-[68vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:max-h-[520px]">
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lila-text-muted)]">Формат кидка</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {diceModeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    void applyDiceMode(option.id);
                  }}
                  className={`min-h-[108px] rounded-2xl border px-3 py-3 text-left transition ${
                    defaultDiceMode === option.id
                      ? 'border-[var(--lila-accent)] bg-[var(--lila-chip-active-bg)] shadow-[0_8px_24px_rgba(197,123,93,0.18)]'
                      : 'border-[var(--lila-chip-border)] bg-[var(--lila-chip-bg)] hover:border-[var(--lila-border-soft)] hover:bg-[var(--lila-surface-muted)]'
                  }`}
                >
                  <p className={`text-sm font-semibold leading-tight sm:text-[13px] lg:text-sm ${defaultDiceMode === option.id ? 'text-[var(--lila-chip-active-text)]' : 'text-[var(--lila-text-primary)]'}`}>
                    {option.title}
                  </p>
                  <p className="mt-1 text-lg leading-none">{option.emoji}</p>
                  <p className={`mt-1 text-xs ${defaultDiceMode === option.id ? 'text-[var(--lila-text-muted)]' : 'text-[var(--lila-text-muted)]'}`}>
                    {option.note}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lila-text-muted)]">Тема</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  type="button"
                  onClick={() => setThemeId(themeOption.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    themeId === themeOption.id
                      ? 'border-[var(--lila-accent)] bg-[var(--lila-chip-active-bg)] text-[var(--lila-chip-active-text)]'
                      : 'border-[var(--lila-chip-border)] bg-[var(--lila-chip-bg)] text-[var(--lila-chip-text)]'
                  }`}
                >
                  {themeOption.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lila-text-muted)]">Фішка</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tokenOptions.map((token) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => setTokenColorId(token.id)}
                  className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs ${
                    tokenColorId === token.id
                      ? 'border-[var(--lila-accent)] bg-[var(--lila-chip-active-bg)] text-[var(--lila-chip-active-text)]'
                      : 'border-[var(--lila-chip-border)] bg-[var(--lila-chip-bg)] text-[var(--lila-chip-text)]'
                  }`}
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: token.value }} />
                  {token.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lila-text-muted)]">Стиль змії</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SNAKE_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSnakeStyleId(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    snakeStyleId === option.id
                      ? 'border-[var(--lila-accent)] bg-[var(--lila-chip-active-bg)] text-[var(--lila-chip-active-text)]'
                      : 'border-[var(--lila-chip-border)] bg-[var(--lila-chip-bg)] text-[var(--lila-chip-text)]'
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
                  className={`h-7 w-7 rounded-full border-2 ${snakeColorId === option.id ? 'scale-110 border-[var(--lila-accent)]' : 'border-[var(--lila-surface)]'}`}
                  style={{ backgroundColor: option.preview }}
                  aria-label={option.label}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lila-text-muted)]">Стиль сходів/стріл</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STAIRS_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStairsStyleId(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    stairsStyleId === option.id
                      ? 'border-[var(--lila-accent)] bg-[var(--lila-chip-active-bg)] text-[var(--lila-chip-active-text)]'
                      : 'border-[var(--lila-chip-border)] bg-[var(--lila-chip-bg)] text-[var(--lila-chip-text)]'
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
                  className={`h-7 w-7 rounded-full border-2 ${stairsColorId === option.id ? 'scale-110 border-[var(--lila-accent)]' : 'border-[var(--lila-surface)]'}`}
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
