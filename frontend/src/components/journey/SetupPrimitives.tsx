import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const SectionCard = ({ title, subtitle, children }: SectionCardProps) => {
  return (
    <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/90 p-4 shadow-[0_12px_30px_rgba(98,76,62,0.1)] backdrop-blur sm:p-5">
      <h3 className="text-sm font-semibold tracking-wide text-stone-900">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-[var(--lila-text-muted)]">{subtitle}</p>}
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
          ? 'border-[#d5b19a] bg-[#f2dfd2] text-[#7a4e3b] shadow-sm'
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
    <section className="rounded-3xl border border-[#e2cfbf] bg-gradient-to-br from-[#fbf1e8] to-[#f6e8dd] p-4 shadow-[0_10px_26px_rgba(151,113,89,0.16)]">
      <p className="text-xs uppercase tracking-wide text-[#9a6e59]">Інтерпретація</p>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">{text}</p>
    </section>
  );
};
