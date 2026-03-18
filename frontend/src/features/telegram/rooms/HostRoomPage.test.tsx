import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HostRoomPage } from './HostRoomPage';

const addHostControlledPlayerMock = vi.fn().mockResolvedValue(undefined);
const rollDiceMock = vi.fn().mockResolvedValue(undefined);

const createRoomsContextValue = (overrides: any = {}) => {
  const base = {
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
    rollDice: rollDiceMock,
    closeActiveCard: vi.fn().mockResolvedValue(undefined),
    saveRoomNote: vi.fn().mockResolvedValue(undefined),
    updatePlayerTokenColor: vi.fn().mockResolvedValue(undefined),
    addHostControlledPlayer: addHostControlledPlayerMock,
    hostSetPlayerCell: vi.fn().mockResolvedValue(undefined),
    clearCurrentRoom: vi.fn(),
    isMyTurn: false,
    connectionState: 'connected',
    lastDiceRoll: undefined,
  };

  return {
    ...base,
    ...overrides,
    currentRoom: overrides.currentRoom
      ? {
        ...base.currentRoom,
        ...overrides.currentRoom,
        room: {
          ...base.currentRoom.room,
          ...(overrides.currentRoom.room ?? {}),
        },
        players: overrides.currentRoom.players ?? base.currentRoom.players,
        gameState: {
          ...base.currentRoom.gameState,
          ...(overrides.currentRoom.gameState ?? {}),
          notes: {
            ...base.currentRoom.gameState.notes,
            ...(overrides.currentRoom.gameState?.notes ?? {}),
          },
          settings: {
            ...base.currentRoom.gameState.settings,
            ...(overrides.currentRoom.gameState?.settings ?? {}),
          },
          perPlayerState: overrides.currentRoom.gameState?.perPlayerState ?? base.currentRoom.gameState.perPlayerState,
          moveHistory: overrides.currentRoom.gameState?.moveHistory ?? base.currentRoom.gameState.moveHistory,
        },
      }
      : base.currentRoom,
  };
};

let roomsContextValue = createRoomsContextValue();

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
  useTelegramRooms: () => roomsContextValue,
}));

describe('HostRoomPage', () => {
  beforeEach(() => {
    roomsContextValue = createRoomsContextValue();
    addHostControlledPlayerMock.mockClear();
    rollDiceMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

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

  it('shows online rules in the header and lets host roll for a regular queued player', async () => {
    roomsContextValue = createRoomsContextValue({
      currentRoom: {
        room: {
          status: 'in_progress',
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
          {
            id: 'player-a',
            roomId: 'room-1',
            userId: 'player-a',
            displayName: 'Anna',
            role: 'player',
            controlMode: 'self',
            tokenColor: '#7c3aed',
            joinedAt: new Date().toISOString(),
            connectionStatus: 'online',
          },
          {
            id: 'player-b',
            roomId: 'room-1',
            userId: 'player-b',
            displayName: 'Bohdan',
            role: 'player',
            controlMode: 'self',
            tokenColor: '#14b8a6',
            joinedAt: new Date().toISOString(),
            connectionStatus: 'online',
          },
        ],
        gameState: {
          currentTurnPlayerId: 'player-a',
          turnVersion: 2,
          perPlayerState: {
            'player-a': { currentCell: 4 },
            'player-b': { currentCell: 2 },
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/host-room/room-1']}>
        <Routes>
          <Route path="/host-room/:roomId" element={<HostRoomPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const user = userEvent.setup();

    expect(screen.getAllByText('Ведучий кидає за будь-якого гравця.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('У черзі лише гравці, кожен чекає свого ходу.').length).toBeGreaterThan(0);

    const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    expect(within(select).getByRole('option', { name: 'Anna' })).toBeTruthy();
    expect(within(select).getByRole('option', { name: 'Bohdan' })).toBeTruthy();

    await user.selectOptions(select, 'player-a');
    await user.click(screen.getByRole('button', { name: 'Кинути за гравця' }));

    expect(rollDiceMock).toHaveBeenCalledWith('player-a');
  });
});
