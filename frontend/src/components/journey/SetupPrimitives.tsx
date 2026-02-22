import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const SectionCard = ({ title, subtitle, children }: SectionCardProps) => {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_30px_rgba(88,84,72,0.08)] backdrop-blur sm:p-5">
      <h3 className="text-sm font-semibold tracking-wide text-stone-900">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-stone-500">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
};

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

export const SoftChip = ({ selected, onClick, children }: ChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition duration-300 ease-out ${
        selected
          ? 'border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm'
          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
      }`}
    >
      {children}
    </button>
  );
};

interface SummaryCardProps {
  text: string;
}

export const SummaryCard = ({ text }: SummaryCardProps) => {
  return (
    <section className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 shadow-[0_10px_26px_rgba(16,185,129,0.12)]">
      <p className="text-xs uppercase tracking-wide text-emerald-700">Інтерпретація</p>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">{text}</p>
    </section>
  );
};
