import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameBoardLayout } from './GameBoardLayout';

vi.mock('../../theme', () => ({
  useBoardTheme: () => ({
    theme: {
      layout: {
        pageMaxWidthPx: 1480,
        boardPanelPaddingPx: 18,
        floatingControlsBackground: 'rgba(255,255,255,0.9)',
        floatingControlsBorder: '#d8cde6',
        floatingControlsShadow: '0 20px 40px rgba(92, 74, 137, 0.14)',
      },
    },
  }),
}));

describe('GameBoardLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps a wide desktop-friendly board-first shell', () => {
    render(
      <GameBoardLayout
        header={<div>HEADER</div>}
        board={<div>BOARD</div>}
        controls={<div>CONTROLS</div>}
      />,
    );

    const layout = screen.getByTestId('game-board-layout');
    expect(layout.className).toContain('lila-page-shell');
    expect(layout.getAttribute('style')).toContain('1480px');
    expect(screen.getByText('BOARD')).not.toBeNull();
    expect(screen.getByText('CONTROLS')).not.toBeNull();
  });
});
