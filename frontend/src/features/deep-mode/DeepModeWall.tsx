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
    <div className="absolute inset-0 z-20 rounded-3xl" data-testid="deep-mode-wall">
      <div className="absolute inset-0 rounded-3xl bg-[#f7efe7]/88 backdrop-blur-[2px]" />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-3 mt-3 rounded-3xl border border-[#e4d4c6] bg-[linear-gradient(135deg,#fff9f3,#f4e8dd)] p-4 text-[#332823] shadow-[0_18px_46px_rgba(100,74,56,0.22)] sm:mx-4 sm:mt-4 sm:p-5"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#f0d6c6]/55 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-[#e9c8b7]/45 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8f6d5b]">Locked Section</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Глибока гра</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#dbc5b6] bg-white/70 px-3 py-1.5 text-xs text-[#6c5548] transition hover:bg-white"
          >
            Закрити
          </button>
        </div>

        <p className="relative mt-3 text-sm leading-6 text-[#6f5d53]">
          Проникніть глибше. Побачте приховані зв’язки. Дослухайтесь до тихих сигналів вашої подорожі.
        </p>

        <ul className="relative mt-4 space-y-2 text-sm text-[#4f3f36]">
          <li className="rounded-xl border border-[#e6d8cd] bg-white/65 px-3 py-2">Глибинні інтерпретації клітин</li>
          <li className="rounded-xl border border-[#e6d8cd] bg-white/65 px-3 py-2">AI-провідник з RAG-пам’яттю</li>
          <li className="rounded-xl border border-[#e6d8cd] bg-white/65 px-3 py-2">Патерни шляху та нові питання</li>
        </ul>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-2xl bg-[#c57b5d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(146,94,70,0.34)] transition hover:bg-[#b96d50]"
          >
            Coming Soon — AI Journey
          </button>
          <span className="rounded-full border border-[#dcc8bc] bg-white/70 px-3 py-1 text-xs text-[#7a6458]">
            Unlock Soon
          </span>
        </div>
      </motion.section>
    </div>
  );
};
