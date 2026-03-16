import type { ReactNode } from 'react';
import { CanvaWingAccent } from '../../components/CanvaWingAccent';
import { useBoardTheme } from '../../theme';

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
}: GameBoardLayoutProps) => {
  const { theme } = useBoardTheme();

  return (
    <main
      className="lila-page-shell"
      data-testid="game-board-layout"
      style={{ maxWidth: `${theme.layout.pageMaxWidthPx}px` }}
    >
      <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.62fr)_360px] xl:grid-rows-[auto_minmax(0,1fr)]">
        <section className="lila-panel px-4 py-4 sm:px-5 xl:col-span-2">
          {header}
        </section>

        <section
          className="lila-panel min-h-[48vh] min-w-0 sm:min-h-[56vh] xl:min-h-0"
          style={{ padding: `${theme.layout.boardPanelPaddingPx}px` }}
        >
          <CanvaWingAccent className="pointer-events-none absolute -right-10 top-0 hidden h-32 w-48 text-[color:rgba(90,72,135,0.16)] md:block" />
          {board}
        </section>

        <section
          className="lila-panel-muted min-h-0 px-3 py-3 sm:px-4 xl:overflow-y-auto"
          style={{
            background: theme.layout.floatingControlsBackground,
            border: `1px solid ${theme.layout.floatingControlsBorder}`,
            boxShadow: theme.layout.floatingControlsShadow,
          }}
        >
          {controls}
        </section>
        {sideContent && (
          <section className="min-h-0 xl:col-span-2">
            {sideContent}
          </section>
        )}
      </div>
    </main>
  );
};
