import { Link } from 'react-router-dom';
import { JourneySetupHub } from '../components/journey/JourneySetupHub';
import { TelegramRoomsPanel } from '../features/telegram';
import { useBoardTheme } from '../theme';

export const GameSetupPage = () => {
  const { themeId, theme, themes, tokenColorId, animationSpeed, setThemeId, setTokenColorId, setAnimationSpeed } = useBoardTheme();

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Leela</p>
          <h1 className="text-2xl font-semibold text-stone-900">Налаштування подорожі</h1>
        </div>
        <Link to="/" className="text-sm text-stone-600 transition hover:text-stone-900">
          Назад
        </Link>
      </header>

      <section className="mb-4 rounded-2xl border border-[#ead9cc] bg-[var(--lila-surface)]/92 p-3 shadow-[0_10px_24px_rgba(98,76,62,0.09)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8b6f60]">Board appearance</p>
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
        <div className="mt-3 flex flex-wrap gap-2">
          {theme.token.palette.map((token) => (
            <button
              key={token.id}
              type="button"
              onClick={() => setTokenColorId(token.id)}
              className={`h-7 w-7 rounded-full border-2 transition ${
                tokenColorId === token.id ? 'scale-110 border-[#7f4f3c]' : 'border-white'
              }`}
              style={{ backgroundColor: token.value }}
              aria-label={token.label}
            />
          ))}
        </div>
        <div className="mt-3 inline-flex rounded-full border border-stone-200 bg-white p-1 text-xs">
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
      </section>

      <JourneySetupHub />
      <div className="mt-5">
        <TelegramRoomsPanel />
      </div>
    </main>
  );
};
