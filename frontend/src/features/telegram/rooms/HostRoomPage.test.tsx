import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HostRoomPage } from './HostRoomPage';

const addHostControlledPlayerMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../components/lila/LilaBoard', () => ({
  LilaBoard: () => <div data-testid="mock-lila-board" />,
}));

vi.mock('../../../components/dice3d/Dice3D', () => ({
  Dice3D: () => null,
}));

vi.mock('../../../components/CellCoachModal', () => ({
  CellCoachModal: () => null,
}));

vi.mock('../../../components/AppearanceCustomizationPanel', () => ({
  AppearanceCustomizationPanel: () => null,
}));

vi.mock('../auth/TelegramAuthContext', () => ({
  useTelegramAuth: () => ({
    isTelegramMode: true,
    user: { id: 'host-user', displayName: 'Host', username: 'soulvio' },
  }),
}));

vi.mock('./TelegramRoomsContext', () => ({
  useTelegramRooms: () => ({
    currentRoom: {
      room: {
        id: 'room-1',
        code: 'ABCDE2',
        hostUserId: 'host-user',
        boardType: 'full',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      players: [
        {
          id: 'host-player',
          roomId: 'room-1',
          userId: 'host-user',
          displayName: '@soulvio',
          role: 'host',
          controlMode: 'self',
          tokenColor: '#1f2937',
          joinedAt: new Date().toISOString(),
          connectionStatus: 'online',
        },
      ],
      gameState: {
        roomId: 'room-1',
        turnVersion: 0,
        currentTurnPlayerId: null,
        perPlayerState: {},
        moveHistory: [],
        activeCard: null,
        notes: {
          hostByCell: {},
          hostByPlayerId: {},
          playerByUserId: {},
        },
        settings: {
          diceMode: 'classic',
          allowHostCloseAnyCard: true,
          hostCanPause: true,
        },
      },
    },
    myRooms: [],
    isLoading: false,
    error: undefined,
    loadRoomById: vi.fn().mockResolvedValue(undefined),
    hostStartGame: vi.fn().mockResolvedValue(undefined),
    hostPauseGame: vi.fn().mockResolvedValue(undefined),
    hostResumeGame: vi.fn().mockResolvedValue(undefined),
    hostFinishGame: vi.fn().mockResolvedValue(undefined),
    hostUpdateSettings: vi.fn().mockResolvedValue(undefined),
    rollDice: vi.fn().mockResolvedValue(undefined),
    closeActiveCard: vi.fn().mockResolvedValue(undefined),
    saveRoomNote: vi.fn().mockResolvedValue(undefined),
    updatePlayerTokenColor: vi.fn().mockResolvedValue(undefined),
    addHostControlledPlayer: addHostControlledPlayerMock,
    hostSetPlayerCell: vi.fn().mockResolvedValue(undefined),
    clearCurrentRoom: vi.fn(),
    isMyTurn: false,
    connectionState: 'connected',
    lastDiceRoll: undefined,
  }),
}));

describe('HostRoomPage', () => {
  it('submits host-controlled player draft from the compact players panel', async () => {
    render(
      <MemoryRouter initialEntries={['/host-room/room-1']}>
        <Routes>
          <Route path="/host-room/:roomId" element={<HostRoomPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const user = userEvent.setup();

    expect(screen.getByTestId('game-board-layout')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Учасники' }));
    await user.type(screen.getByPlaceholderText('Імʼя гравця'), 'Anna');
    await user.click(screen.getByRole('button', { name: 'Додати' }));

    expect(addHostControlledPlayerMock).toHaveBeenCalledWith('Anna');
  });
});
