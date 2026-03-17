import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MultiplayerStartPage } from './MultiplayerStartPage';

const refreshMyRooms = vi.fn();

vi.mock('../../features/telegram', () => ({
  useTelegramAuth: () => ({
    isTelegramMode: true,
    status: 'authenticated',
  }),
  TelegramRoomsPanel: () => <div data-testid="mock-telegram-rooms-panel">ROOMS_PANEL</div>,
}));

vi.mock('../../features/telegram/rooms/TelegramRoomsContext', () => ({
  useTelegramRooms: () => ({
    myRooms: [
      {
        room: {
          id: 'room-1',
          code: 'ABCD12',
          status: 'open',
          boardType: 'full',
        },
      },
    ],
    refreshMyRooms,
    error: undefined,
  }),
}));

describe('MultiplayerStartPage', () => {
  afterEach(() => {
    cleanup();
    refreshMyRooms.mockReset();
  });

  it('renders multiplayer entry shell and opens past rooms from a compact modal entry point', async () => {
    render(
      <MemoryRouter>
        <MultiplayerStartPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('main').className).toContain('lila-page-shell');
    expect(screen.getByTestId('multiplayer-start-layout').className).toContain('grid-rows-[auto_minmax(0,1fr)]');
    expect(screen.getByText('Твій кабінет провідника')).not.toBeNull();
    expect(screen.getByTestId('mock-telegram-rooms-panel')).not.toBeNull();
    expect(screen.getByText('#ABCD12')).not.toBeNull();
    expect(refreshMyRooms).toHaveBeenCalledTimes(1);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Минулі кімнати' }));
    expect(screen.getByText('Закрити')).not.toBeNull();
  });
});
