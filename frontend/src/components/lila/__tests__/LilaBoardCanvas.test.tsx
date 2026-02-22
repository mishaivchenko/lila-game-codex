import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LilaBoardCanvas } from '../LilaBoardCanvas';
import { PATH_DRAW_DURATION_MS, TOKEN_MOVE_DURATION_MS } from '../../../lib/animations/lilaMotion';

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

  it('renders animated path and calls onMoveAnimationComplete after timing', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <LilaBoardCanvas
        boardType="full"
        currentCell={14}
        animationMove={{ id: 'm1', fromCell: 4, toCell: 14, type: 'arrow' }}
        onMoveAnimationComplete={onComplete}
      />,
    );

    expect(screen.getByTestId('lila-path-arrow')).not.toBeNull();
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(PATH_DRAW_DURATION_MS + TOKEN_MOVE_DURATION_MS - 1);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledWith('m1');

    vi.useRealTimers();
  });
});
