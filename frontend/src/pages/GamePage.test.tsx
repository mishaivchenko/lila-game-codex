import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePage } from './GamePage';
import type { GameSession, GameMove } from '../domain/types';
import { PATH_DRAW_DURATION_MS, TOKEN_MOVE_DURATION_MS } from '../lib/animations/lilaMotion';

const mockUseGameContext = vi.fn();

vi.mock('../context/GameContext', () => ({
  useGameContext: () => mockUseGameContext(),
}));

const baseSession: GameSession = {
  id: 's1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  boardType: 'full',
  currentCell: 1,
  settings: { speed: 'normal', depth: 'standard' },
  request: { isDeepEntry: false, simpleRequest: 'test' },
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
      vi.advanceTimersByTime(619);
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
      fromCell: 17,
      toCell: 7,
      dice: 3,
      snakeOrArrow: 'snake',
      createdAt: new Date().toISOString(),
    };

    mockUseGameContext.mockReturnValue({
      currentSession: { ...baseSession, currentCell: 7 },
      performMove: vi.fn().mockResolvedValue(move),
      saveInsight: vi.fn().mockResolvedValue(undefined),
      error: undefined,
    });

    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByText('Кинути кубик'));
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(PATH_DRAW_DURATION_MS + TOKEN_MOVE_DURATION_MS - 1);
    });
    expect(screen.queryByText('Зберегти і продовжити')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Зберегти і продовжити')).not.toBeNull();
  });
});
