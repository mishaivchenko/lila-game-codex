import type { ReactNode } from 'react';

interface GameBoardLayoutProps {
  header: ReactNode;
  board: ReactNode;
  controls: ReactNode;
  sideContent?: ReactNode;
}

export const GameBoardLayout = ({
  header,
  board,
  controls,
  sideContent,
}: GameBoardLayoutProps) => (
  <main className="mx-auto min-h-screen w-full max-w-[460px] bg-[var(--lila-bg-main)] px-3 pb-28 pt-3 sm:px-4">
    <div className="space-y-3">
      <section className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-3 shadow-[0_6px_20px_rgba(98,76,62,0.08)]">
        {header}
      </section>

      <section className="relative rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-2 shadow-[0_16px_36px_rgba(98,76,62,0.14)]">
        {board}
      </section>

      {sideContent && (
        <section className="space-y-3">
          {sideContent}
        </section>
      )}
    </div>

    <section className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto w-[min(460px,calc(100%-1rem))] rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/96 p-2 shadow-[0_20px_40px_rgba(63,46,34,0.25)] backdrop-blur-sm">
      {controls}
    </section>
  </main>
);
