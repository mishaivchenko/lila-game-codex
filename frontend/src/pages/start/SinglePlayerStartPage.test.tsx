import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SinglePlayerStartPage } from './SinglePlayerStartPage';

const {
  listSessions,
  getLastActiveSession,
  loadSession,
  resumeLastSession,
} = vi.hoisted(() => ({
  listSessions: vi.fn().mockResolvedValue([]),
  getLastActiveSession: vi.fn().mockResolvedValue(undefined),
  loadSession: vi.fn().mockResolvedValue(undefined),
  resumeLastSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../repositories', () => ({
  createRepositories: () => ({
    sessionsRepository: {
      listSessions,
      getLastActiveSession,
    },
  }),
}));

vi.mock('../../context/GameContext', () => ({
  useGameContext: () => ({
    loadSession,
    resumeLastSession,
  }),
}));

describe('SinglePlayerStartPage', () => {
  afterEach(() => {
    cleanup();
    listSessions.mockClear();
    getLastActiveSession.mockClear();
    loadSession.mockClear();
    resumeLastSession.mockClear();
  });

  it('uses a compact responsive shell and opens archive history in a modal entry point', async () => {
    render(
      <MemoryRouter>
        <SinglePlayerStartPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(listSessions).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('single-start-layout').className).toContain('grid-rows-[auto_minmax(0,1fr)]');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Історія сесій' }));

    expect(screen.getByText('Закрити')).not.toBeNull();
  });
});
