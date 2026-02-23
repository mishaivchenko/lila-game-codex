import { Link } from 'react-router-dom';
import { DEEP_MODE_ROUTE } from './deepMode.routes';
import { useDeepModeStore } from './useDeepModeStore';

export const DeepModeCard = () => {
  const { isLocked, hasSeenDeepMode, markDeepModeSeen } = useDeepModeStore();

  return (
    <section className="rounded-3xl border border-[#e8d8cb] bg-[linear-gradient(135deg,#fffaf5,#f3e7dc)] p-5 text-[#312723] shadow-[0_16px_44px_rgba(98,76,62,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Глибока гра</h2>
        <span className="rounded-full border border-[#d9c2b1] bg-white/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#7e6558]">
          {isLocked ? 'locked' : 'open'}
        </span>
      </div>

      <p className="mt-2 text-sm text-[#6a5b52]">
        Тиха зона для глибшої роботи: більше сенсу, більше зв’язків, більше м’яких інсайтів.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          to={DEEP_MODE_ROUTE}
          onClick={markDeepModeSeen}
          className="rounded-xl bg-[#c57b5d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b96d50]"
        >
          Глибока гра
        </Link>
        <span className="text-xs text-[#7a685f]">{hasSeenDeepMode ? 'Доступно в меню (Coming Soon)' : 'Нова секція: Coming Soon'}</span>
      </div>
    </section>
  );
};
