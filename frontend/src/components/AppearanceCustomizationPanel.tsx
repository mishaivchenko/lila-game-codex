import { useMemo, useState } from 'react';
import {
  SNAKE_COLOR_OPTIONS,
  SNAKE_STYLE_OPTIONS,
  STAIRS_COLOR_OPTIONS,
  STAIRS_STYLE_OPTIONS,
  useBoardTheme,
} from '../theme';

interface AppearanceCustomizationPanelProps {
  className?: string;
  defaultExpanded?: boolean;
  title?: string;
}

export const AppearanceCustomizationPanel = ({
  className,
  defaultExpanded = false,
  title = 'Кастомізація вигляду',
}: AppearanceCustomizationPanelProps) => {
  const {
    themeId,
    themes,
    tokenColorId,
    animationSpeed,
    snakeStyleId,
    snakeColorId,
    stairsStyleId,
    stairsColorId,
    setThemeId,
    setTokenColorId,
    setAnimationSpeed,
    setSnakeStyleId,
    setSnakeColorId,
    setStairsStyleId,
    setStairsColorId,
    theme,
  } = useBoardTheme();

  const [expanded, setExpanded] = useState(defaultExpanded);

  const tokenOptions = useMemo(() => theme.token.palette, [theme.token.palette]);

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

          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Швидкість анімацій</p>
            <div className="mt-2 inline-flex rounded-full border border-stone-200 bg-white p-1 text-xs">
              {(['slow', 'normal', 'fast'] as const).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setAnimationSpeed(speed)}
                  className={`rounded-full px-3 py-1 ${animationSpeed === speed ? 'bg-[#f1dfd2] text-[#6b4a3b]' : 'text-stone-600'}`}
                >
                  {speed === 'slow' ? 'Повільно' : speed === 'normal' ? 'Нормально' : 'Швидко'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
