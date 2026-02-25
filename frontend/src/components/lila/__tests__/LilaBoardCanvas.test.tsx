import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LilaBoardCanvas } from '../LilaBoardCanvas';
import { DEFAULT_MOVEMENT_SETTINGS } from '../../../engine/movement/MovementEngine';

vi.mock('../LilaPathAnimation', () => ({
  LilaPathAnimation: ({ type }: { type: 'snake' | 'arrow' }) => (
    <div data-testid={`lila-transition-${type}`} />
  ),
}));

afterEach(() => {
  cleanup();
});

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
      vi.advanceTimersByTime(
        DEFAULT_MOVEMENT_SETTINGS.stepDurationMs + DEFAULT_MOVEMENT_SETTINGS.snakeDelayMs - 1,
      );
    });
    expect(screen.queryByTestId('lila-transition-arrow')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(2);
    });

    expect(screen.getByTestId('lila-transition-arrow')).not.toBeNull();

    vi.useRealTimers();
  });

  it('animates through explicit step path even when start and end cells match', () => {
    vi.useFakeTimers();
    const onMoveAnimationComplete = vi.fn();

    const { container } = render(
      <LilaBoardCanvas
        boardType="full"
        currentCell={71}
        animationMove={{
          id: 'm-bounce',
          fromCell: 71,
          toCell: 71,
          type: null,
          tokenPathCells: [71, 72, 71],
        }}
        onMoveAnimationComplete={onMoveAnimationComplete}
      />,
    );

    const token = within(container).getByLabelText('token');
    const startLeft = token.getAttribute('style') ?? '';

    act(() => {
      vi.advanceTimersByTime(
        Math.round(DEFAULT_MOVEMENT_SETTINGS.stepDurationMs / 2),
      );
    });

    const midLeft = token.getAttribute('style') ?? '';
    expect(midLeft).not.toBe(startLeft);

    act(() => {
      vi.advanceTimersByTime(
        DEFAULT_MOVEMENT_SETTINGS.stepDurationMs + DEFAULT_MOVEMENT_SETTINGS.stepPauseMs + DEFAULT_MOVEMENT_SETTINGS.stepDurationMs + 20,
      );
    });

    expect(onMoveAnimationComplete).toHaveBeenCalledWith('m-bounce');
    vi.useRealTimers();
  });
});
