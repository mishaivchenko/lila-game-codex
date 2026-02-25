import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import { GamePage } from './GamePage';
import type { GameMove, GameSession } from '../domain/types';
import { BOARD_DEFINITIONS } from '../content/boards';
import { resolveTransitionEntryCell } from '../lib/lila/moveVisualization';

const mockUseGameContext = vi.fn();

vi.mock('../context/GameContext', () => ({
  useGameContext: () => mockUseGameContext(),
}));

vi.mock('../components/dice3d/Dice3D', () => ({
  Dice3D: ({
    rollToken,
    onResult,
    onFinished,
  }: {
    rollToken: number;
    onResult: (value: number) => void;
    onFinished?: () => void;
  }) => {
    useEffect(() => {
      if (rollToken > 0) {
        onResult(1);
        onFinished?.();
      }
    }, [onFinished, onResult, rollToken]);
    return null;
  },
}));

vi.mock('../components/lila/LilaBoard', () => ({
  LilaBoard: ({
    animationMove,
    onMoveAnimationComplete,
    onCellSelect,
  }: {
    animationMove?: { id: string; type: 'snake' | 'arrow' | null; toCell: number };
    onMoveAnimationComplete?: (moveId: string) => void;
    onCellSelect?: (cellNumber: number) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onCellSelect?.(67)}>
        board-cell-67
      </button>
      <button
        type="button"
        onClick={() => {
          if (animationMove) {
            onMoveAnimationComplete?.(animationMove.id);
          }
        }}
      >
        finish-board-animation
      </button>
      <div data-testid="animation-state">
        {animationMove ? `${animationMove.id}:${animationMove.type ?? 'none'}:${animationMove.toCell}` : 'none'}
      </div>
    </div>
  ),
}));

vi.mock('../components/CellCoachModal', () => ({
  CellCoachModal: ({
    cellNumber,
    onClose,
  }: {
    cellNumber: number;
    onClose: () => void;
  }) => (
    <div data-testid="coach-modal">
      <span>{`card-cell-${cellNumber}`}</span>
      <button type="button" onClick={onClose}>
        close-card
      </button>
    </div>
  ),
}));

const baseSession: GameSession = {
  id: 'session-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  boardType: 'full',
  currentCell: 1,
  settings: { speed: 'normal', depth: 'standard' },
  request: { isDeepEntry: false, simpleRequest: 'test' },
  sessionStatus: 'active',
  finished: false,
  hasEnteredGame: true,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <GamePage />
    </MemoryRouter>,
  );

describe('GamePage board/card interactions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    mockUseGameContext.mockReset();
    cleanup();
  });

  it('opens a card when selecting a board cell', () => {
    mockUseGameContext.mockReturnValue({
      currentSession: baseSession,
      performMove: vi.fn(),
      finishSession: vi.fn().mockResolvedValue(undefined),
      saveInsight: vi.fn().mockResolvedValue(undefined),
      updateSessionRequest: vi.fn().mockResolvedValue(undefined),
      resumeLastSession: vi.fn().mockResolvedValue(undefined),
      loading: false,
      error: undefined,
    });

    renderPage();
    fireEvent.click(screen.getByText('board-cell-67'));

    expect(screen.queryByText('card-cell-67')).not.toBeNull();
  });

  it('runs snake flow and keeps card closed until animation completion', async () => {
    const snakeMove: GameMove = {
      id: 'move-snake',
      sessionId: baseSession.id,
      moveNumber: 1,
      fromCell: 43,
      toCell: 9,
      dice: 1,
      moveType: 'snake',
      snakeOrArrow: 'snake',
      createdAt: new Date().toISOString(),
    };

    mockUseGameContext.mockReturnValue({
      currentSession: { ...baseSession, currentCell: 9 },
      performMove: vi.fn().mockResolvedValue(snakeMove),
      finishSession: vi.fn().mockResolvedValue(undefined),
      saveInsight: vi.fn().mockResolvedValue(undefined),
      updateSessionRequest: vi.fn().mockResolvedValue(undefined),
      resumeLastSession: vi.fn().mockResolvedValue(undefined),
      loading: false,
      error: undefined,
    });

    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByText('Кинути кубик'));
      await Promise.resolve();
    });

    const entryCell = resolveTransitionEntryCell(
      snakeMove.fromCell,
      snakeMove.dice,
      BOARD_DEFINITIONS.full,
      snakeMove.snakeOrArrow,
      snakeMove.toCell,
    );
    expect(entryCell).toBeDefined();

    expect(screen.getByTestId('animation-state').textContent).toContain(`:none:${entryCell}`);
    expect(screen.queryByTestId('coach-modal')).toBeNull();

    act(() => {
      fireEvent.click(screen.getByText('finish-board-animation'));
      vi.runAllTimers();
    });

    expect(screen.getByText(`card-cell-${entryCell}`)).not.toBeNull();

    act(() => {
      fireEvent.click(screen.getByText('close-card'));
    });

    expect(screen.getByTestId('animation-state').textContent).toContain('move-snake-tail:snake:9');

    act(() => {
      fireEvent.click(screen.getByText('finish-board-animation'));
      vi.runAllTimers();
    });
    expect(screen.getByTestId('animation-state').textContent).toBe('none');
  });

  it('does not allow second roll while movement is animating', async () => {
    const move: GameMove = {
      id: 'move-normal',
      sessionId: baseSession.id,
      moveNumber: 1,
      fromCell: 8,
      toCell: 11,
      dice: 3,
      moveType: 'normal',
      snakeOrArrow: null,
      createdAt: new Date().toISOString(),
    };
    const performMove = vi.fn().mockResolvedValue(move);

    mockUseGameContext.mockReturnValue({
      currentSession: { ...baseSession, currentCell: 11 },
      performMove,
      finishSession: vi.fn().mockResolvedValue(undefined),
      saveInsight: vi.fn().mockResolvedValue(undefined),
      updateSessionRequest: vi.fn().mockResolvedValue(undefined),
      resumeLastSession: vi.fn().mockResolvedValue(undefined),
      loading: false,
      error: undefined,
    });

    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByText('Кинути кубик'));
      fireEvent.click(screen.getByText('Кинути кубик'));
      await Promise.resolve();
    });

    expect(performMove).toHaveBeenCalledTimes(1);
  });
});
