import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

const mockNavigate = vi.fn();
const mockLoadSession = vi.fn().mockResolvedValue(undefined);
const mockResumeLastSession = vi.fn().mockResolvedValue(undefined);
const mockFetchUserGameHistory = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/GameContext', () => ({
  useGameContext: () => ({
    resumeLastSession: mockResumeLastSession,
    loadSession: mockLoadSession,
  }),
}));

vi.mock('../features/telegram', () => ({
  useTelegramAuth: () => ({
    isTelegramMode: true,
    status: 'authenticated',
    token: 'token',
    user: { displayName: 'Tester' },
  }),
  TelegramRoomsPanel: () => <div data-testid="rooms-panel" />,
}));

vi.mock('../features/telegram/history/gamesApi', () => ({
  fetchUserGameHistory: (...args: unknown[]) => mockFetchUserGameHistory(...args),
}));

vi.mock('../components/AppearanceCustomizationPanel', () => ({
  AppearanceCustomizationPanel: () => <div data-testid="appearance-panel" />,
}));

vi.mock('../components/journey/JourneySetupHub', () => ({
  JourneySetupHub: () => <div data-testid="setup-hub" />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomePage game history', () => {
  it('renders Telegram journeys block and continues in-progress session', async () => {
    mockFetchUserGameHistory.mockResolvedValueOnce([
      {
        id: 'session-1',
        boardType: 'full',
        currentCell: 37,
        status: 'in_progress',
        createdAt: '2026-02-26T10:00:00.000Z',
        updatedAt: '2026-02-26T10:10:00.000Z',
        throwsCount: 5,
        hasNotes: true,
        payload: {
          id: 'session-1',
          createdAt: '2026-02-26T10:00:00.000Z',
          updatedAt: '2026-02-26T10:10:00.000Z',
          boardType: 'full',
          currentCell: 37,
          settings: { diceMode: 'classic', depth: 'standard' },
          request: { isDeepEntry: false, simpleRequest: 'Запит' },
          sessionStatus: 'active',
          finished: false,
          hasEnteredGame: true,
        },
      },
    ]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Мої подорожі')).not.toBeNull();
    expect(screen.getByText('Клітина 37', { exact: false })).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Продовжити' }));

    await waitFor(() => {
      expect(mockLoadSession).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/game');
    });
  });
});
