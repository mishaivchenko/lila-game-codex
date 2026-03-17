import type { ReactNode } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
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
      <div className="lila-canva-frame min-h-0">
        <div
          className="grid min-h-0 flex-1 gap-3 grid-rows-[auto_minmax(0,1fr)_auto] min-[1180px]:grid-cols-[minmax(0,1.24fr)_304px] min-[1180px]:grid-rows-[auto_minmax(0,1fr)]"
          data-testid="game-board-layout-grid"
        >
          <section className="min-[1180px]:col-span-2">
            {header}
          </section>

          <section
            className="lila-poster-panel flex min-h-0 min-w-0"
            style={{ padding: `${theme.layout.boardPanelPaddingPx}px` }}
          >
            <BrandLogo
              alt="SoulVio Ліла"
              className="pointer-events-none absolute -right-12 bottom-2 hidden h-40 w-40 opacity-[var(--lila-brand-mark-opacity)] md:block"
            />
            {board}
          </section>

          <section
            className="lila-canva-sidebar min-h-0 max-h-[26vh] overflow-hidden px-3 py-3 sm:max-h-[30vh] sm:px-4 min-[1180px]:max-h-none min-[1180px]:overflow-y-auto"
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
