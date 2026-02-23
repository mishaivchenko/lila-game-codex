import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LilaBoardCanvas } from '../LilaBoardCanvas';
import { TOKEN_MOVE_DURATION_MS } from '../../../lib/animations/lilaMotion';

vi.mock('../LilaPathAnimation', () => ({
  LilaPathAnimation: ({ type }: { type: 'snake' | 'arrow' }) => (
    <div data-testid={`lila-transition-${type}`} />
  ),
}));

describe('LilaBoardCanvas', () => {
  it('renders full board image and token overlay', () => {
    render(<LilaBoardCanvas boardType="full" currentCell={10} />);

    const board = screen.getByTestId('lila-board-canvas');
    const image = screen.getByAltText('Lila full board');
    const token = screen.getByLabelText('token');

    expect(board).not.toBeNull();
    expect(image.getAttribute('src')).toContain('/field/');
    expect(token).not.toBeNull();
  });

  it('renders short board with dedicated short-board PNG', () => {
    render(<LilaBoardCanvas boardType="short" currentCell={10} />);

    const image = screen.getByAltText('Lila short board');
    expect(image.getAttribute('src')).toContain('lila-board-short.png');
  });

  it('renders transition animation layer for special move', () => {
    vi.useFakeTimers();

    render(
      <LilaBoardCanvas
        boardType="full"
        currentCell={23}
        animationMove={{ id: 'm1', fromCell: 7, toCell: 23, type: 'arrow', entryCell: 10 }}
      />,
    );

    expect(screen.queryByTestId('lila-transition-arrow')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(TOKEN_MOVE_DURATION_MS);
    });
    expect(screen.getByTestId('lila-transition-arrow')).not.toBeNull();

    vi.useRealTimers();
  });
});
