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
      className="lila-page-shell lila-page-shell--game"
      data-testid="game-board-layout"
      style={{ maxWidth: `${theme.layout.pageMaxWidthPx}px` }}
    >
      <div className="lila-canva-frame min-h-0 flex-1 overflow-hidden">
        <div
          className="grid min-h-0 flex-1 gap-1.5 overflow-hidden grid-rows-[auto_minmax(0,1fr)] min-[1120px]:grid-cols-[minmax(0,1fr)_220px] min-[1120px]:grid-rows-[auto_minmax(0,1fr)]"
          data-testid="game-board-layout-grid"
        >
          <section className="min-[1120px]:col-span-2">
            {header}
          </section>

          <section
            className="relative flex min-h-0 min-w-0 items-start justify-center overflow-hidden pb-[4.2rem] sm:pb-[4.8rem] min-[1120px]:items-center min-[1120px]:pb-0"
            style={{ padding: `${theme.layout.boardPanelPaddingPx}px` }}
          >
            {board}
            {mobileControls ? (
              <div className="absolute inset-x-1.5 bottom-1.5 z-10 min-[1120px]:hidden" data-testid="game-mobile-controls-overlay">
                {mobileControls}
              </div>
            ) : null}
          </section>

          <section
            className="hidden min-h-0 lila-canva-sidebar px-2.5 py-2.5 sm:px-3 min-[1120px]:block min-[1120px]:overflow-y-auto"
            style={{
              background: theme.layout.floatingControlsBackground,
              border: `1px solid ${theme.layout.floatingControlsBorder}`,
              boxShadow: theme.layout.floatingControlsShadow,
            }}
          >
            {controls}
          </section>
          {sideContent && (
            <section className="min-h-0 min-[1120px]:col-span-2">
              {sideContent}
            </section>
          )}
        </div>
      </div>
    </main>
  );
};
