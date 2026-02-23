import { Link } from 'react-router-dom';
import { DEEP_MODE_ROUTE } from './deepMode.routes';
import { useDeepModeStore } from './useDeepModeStore';

export const DeepModeCard = () => {
  const { isLocked, hasSeenDeepMode, markDeepModeSeen } = useDeepModeStore();

  return (
    <section className="rounded-3xl border border-cyan-100/60 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1f2937] p-5 text-slate-100 shadow-[0_16px_44px_rgba(15,23,42,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Deep Game (AI)</h2>
        <span className="rounded-full border border-cyan-200/40 bg-cyan-400/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100">
          {isLocked ? 'locked' : 'open'}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-300">
        Новий рівень подорожі: загадковий AI Wall із глибинною перспективою вашого шляху.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          to={DEEP_MODE_ROUTE}
          onClick={markDeepModeSeen}
          className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200"
        >
          Deep Game
        </Link>
        <span className="text-xs text-slate-300">{hasSeenDeepMode ? 'Доступно в меню (Coming Soon)' : 'Нова секція: Coming Soon'}</span>
      </div>
    </section>
  );
};
