import { motion } from 'framer-motion';

interface DeepModeWallProps {
  open: boolean;
  onClose?: () => void;
}

export const DeepModeWall = ({ open, onClose }: DeepModeWallProps) => {
  if (!open) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-y-auto bg-[#090c1b] text-slate-100" data-testid="deep-mode-wall">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <motion.div
          className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.36, 0.52, 0.36] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[-5rem] top-40 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl"
          animate={{ scale: [1.04, 1, 1.04], opacity: [0.22, 0.38, 0.22] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.1),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(147,197,253,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.08)_1px,transparent_1px)] bg-[length:38px_38px]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6"
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-cyan-200/35 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-md">
            Deep Layer
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm transition hover:bg-white/10"
          >
            Закрити
          </button>
        </div>

        <article className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_24px_80px_rgba(8,20,46,0.55)] backdrop-blur-xl sm:p-8">
          <motion.div
            className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/40 bg-cyan-300/10 text-xl"
            animate={{ boxShadow: ['0 0 0 rgba(34,211,238,0.2)', '0 0 28px rgba(34,211,238,0.34)', '0 0 0 rgba(34,211,238,0.2)'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            ◎
          </motion.div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Deep Game (AI)</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
            Проникніть глибше. Побачте приховані зв’язки. Дослухайтесь до тихих сигналів вашої подорожі.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-cyan-50/95">
            <li className="rounded-xl border border-cyan-100/20 bg-cyan-100/5 px-4 py-3">Глибинні інтерпретації клітин</li>
            <li className="rounded-xl border border-cyan-100/20 bg-cyan-100/5 px-4 py-3">AI-провідник з RAG-пам’яттю</li>
            <li className="rounded-xl border border-cyan-100/20 bg-cyan-100/5 px-4 py-3">Патерни шляху та нові питання</li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_34px_rgba(45,212,191,0.38)] transition hover:brightness-110"
            >
              Coming Soon — AI Journey
            </button>
            <span className="rounded-full border border-white/30 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Unlock Soon
            </span>
          </div>
        </article>

        <section className="mt-6 grid gap-3 pb-10 text-xs text-slate-300 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
            Deep Mode відкриє персональні шари сенсу на основі вашого реального маршруту.
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
            Це не звичайні підказки: лише цільові спостереження, питання і сигнал вашого циклу.
          </div>
        </section>
      </motion.section>
    </main>
  );
};
