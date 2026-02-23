import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePage } from './GamePage';
import type { GameSession, GameMove } from '../domain/types';
import { TOKEN_MOVE_DURATION_MS } from '../lib/animations/lilaMotion';
import { TRANSITION_TOTAL_MS } from '../components/lila/transitionAnimationConfig';
import { useEffect } from 'react';

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
        onResult(4);
        onFinished?.();
      }
    }, [onFinished, onResult, rollToken]);
    return null;
  },
}));

const baseSession: GameSession = {
  id: 's1',
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

describe('GamePage modal timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    mockUseGameContext.mockReset();
    cleanup();
  });

  it('opens modal only after normal token movement duration', async () => {
    const move: GameMove = {
      id: 'm1',
      sessionId: 's1',
      moveNumber: 1,
      fromCell: 1,
      toCell: 5,
      dice: 4,
      snakeOrArrow: null,
      createdAt: new Date().toISOString(),
    };

    mockUseGameContext.mockReturnValue({
      currentSession: { ...baseSession, currentCell: 5 },
      performMove: vi.fn().mockResolvedValue(move),
      finishSession: vi.fn().mockResolvedValue(undefined),
      saveInsight: vi.fn().mockResolvedValue(undefined),
      error: undefined,
    });

    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByText('Кинути кубик'));
      await Promise.resolve();
    });

    expect(screen.queryByText('Зберегти і продовжити')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(TOKEN_MOVE_DURATION_MS - 1);
    });
    expect(screen.queryByText('Зберегти і продовжити')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Зберегти і продовжити')).not.toBeNull();
  });

  it('opens modal only after snake/arrow full animation duration', async () => {
    const move: GameMove = {
      id: 'm2',
      sessionId: 's1',
      moveNumber: 2,
      fromCell: 21,
      toCell: 7,
      dice: 3,
      snakeOrArrow: 'snake',
      createdAt: new Date().toISOString(),
    };

    mockUseGameContext.mockReturnValue({
      currentSession: { ...baseSession, currentCell: 7 },
      performMove: vi.fn().mockResolvedValue(move),
      finishSession: vi.fn().mockResolvedValue(undefined),
      saveInsight: vi.fn().mockResolvedValue(undefined),
      error: undefined,
    });

    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByText('Кинути кубик'));
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(TOKEN_MOVE_DURATION_MS - 1);
    });
    expect(screen.queryByText('Зберегти і продовжити')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('lila-transition-snake')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(TRANSITION_TOTAL_MS - 1);
    });
    expect(screen.queryByText('Зберегти і продовжити')).toBeNull();

    for (let i = 0; i < 20 && !screen.queryByText('Зберегти і продовжити'); i += 1) {
      act(() => {
        vi.advanceTimersByTime(16);
      });
    }
    expect(screen.getByText('Зберегти і продовжити')).not.toBeNull();
  });
});
