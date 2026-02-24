export const DeepModeCard = () => {
  return (
    <section className="rounded-3xl border border-[#e8d8cb] bg-[linear-gradient(135deg,#fffaf5,#f3e7dc)] p-5 text-[#312723] shadow-[0_16px_44px_rgba(98,76,62,0.14)]">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#8f6d5b]">Deep Journey</p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">Ask AI assistant (Coming soon)</h2>

      <p className="mt-2 text-sm text-[#6a5b52]">
        Скоро тут з’явиться AI-помічник для глибших інсайтів, патернів шляху та точніших запитань.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          className="rounded-xl bg-[#c57b5d] px-4 py-2 text-sm font-semibold text-white opacity-75"
        >
          Coming Soon — AI Journey
        </button>
        <span className="text-xs text-[#7a685f]">Поки недоступно для запуску</span>
      </div>
    </section>
  );
};
