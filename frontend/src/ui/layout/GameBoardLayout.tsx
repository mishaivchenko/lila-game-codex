import type { ReactNode } from 'react';
import { useBoardTheme } from '../../theme';

interface GameBoardLayoutProps {
  header: ReactNode;
  board: ReactNode;
  controls: ReactNode;
  mobileControls?: ReactNode;
  sideContent?: ReactNode;
}

export const GameBoardLayout = ({
  header,
  board,
  controls,
  mobileControls,
  sideContent,
}: GameBoardLayoutProps) => {
  const { theme } = useBoardTheme();

  return (
    <main
      className="lila-page-shell"
      data-testid="game-board-layout"
      style={{ maxWidth: `${theme.layout.pageMaxWidthPx}px` }}
    >
      <div className="lila-canva-frame min-h-0 flex-1 overflow-hidden">
        <div
          className="grid min-h-0 flex-1 gap-2 overflow-hidden grid-rows-[auto_minmax(0,1fr)] min-[1180px]:grid-cols-[minmax(0,1fr)_268px] min-[1180px]:grid-rows-[auto_minmax(0,1fr)]"
          data-testid="game-board-layout-grid"
        >
          <section className="min-[1180px]:col-span-2">
            {header}
          </section>

          <section
            className="relative flex min-h-0 min-w-0 items-start justify-center overflow-hidden pb-[5rem] sm:pb-[5.6rem] min-[1180px]:items-center min-[1180px]:pb-0"
            style={{ padding: `${theme.layout.boardPanelPaddingPx}px` }}
          >
            {board}
            {mobileControls ? (
              <div className="absolute inset-x-2 bottom-2 z-10 min-[1180px]:hidden" data-testid="game-mobile-controls-overlay">
                {mobileControls}
              </div>
            ) : null}
          </section>

          <section
            className="hidden min-h-0 lila-canva-sidebar px-3 py-3 sm:px-4 min-[1180px]:block min-[1180px]:overflow-y-auto"
            style={{
              background: theme.layout.floatingControlsBackground,
              border: `1px solid ${theme.layout.floatingControlsBorder}`,
              boxShadow: theme.layout.floatingControlsShadow,
            }}
          >
            {controls}
          </section>
          {sideContent && (
            <section className="min-h-0 min-[1180px]:col-span-2">
              {sideContent}
            </section>
          )}
        </div>
      </div>
    </main>
  );
};
