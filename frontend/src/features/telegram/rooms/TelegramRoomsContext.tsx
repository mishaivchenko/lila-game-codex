import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  HostRoomSocket,
  RoomBoardType,
  RoomDiceRolledPayload,
  RoomNoteScope,
  RoomSettings,
  RoomSnapshot,
  RoomTokenMovedPayload,
} from './roomsApi';
import {
  closeRoomCardApi,
  createRoomApi,
  createHostRoomSocket,
  getRoomByCodeApi,
  getRoomByIdApi,
  hostFinishRoomApi,
  hostPauseRoomApi,
  hostResumeRoomApi,
  hostStartRoomApi,
  joinRoomApi,
  saveRoomNoteApi,
  updateRoomPreferencesApi,
  updateRoomSettingsApi,
} from './roomsApi';

interface TelegramRoomsContextValue {
  currentRoom?: RoomSnapshot;
  isLoading: boolean;
  error?: string;
  connectionState: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  currentUserRole?: 'host' | 'player';
  isMyTurn: boolean;
  lastDiceRoll?: RoomDiceRolledPayload;
  lastTokenMove?: RoomTokenMovedPayload;
  createRoom: (boardType?: RoomBoardType) => Promise<RoomSnapshot | undefined>;
  joinRoomByCode: (code: string) => Promise<RoomSnapshot | undefined>;
  loadRoomById: (roomId: string) => Promise<RoomSnapshot | undefined>;
  hostStartGame: () => Promise<void>;
  hostPauseGame: () => Promise<void>;
  hostResumeGame: () => Promise<void>;
  hostFinishGame: () => Promise<void>;
  hostUpdateSettings: (patch: Partial<RoomSettings>) => Promise<void>;
  rollDice: () => Promise<void>;
  closeActiveCard: () => Promise<void>;
  saveRoomNote: (payload: { cellNumber: number; note: string; scope: RoomNoteScope; targetPlayerId?: string }) => Promise<void>;
  updatePlayerTokenColor: (tokenColor: string) => Promise<void>;
}

const TelegramRoomsContext = createContext<TelegramRoomsContextValue>({
  isLoading: false,
  connectionState: 'idle',
  isMyTurn: false,
  createRoom: async () => undefined,
  joinRoomByCode: async () => undefined,
  loadRoomById: async () => undefined,
  hostStartGame: async () => {},
  hostPauseGame: async () => {},
  hostResumeGame: async () => {},
  hostFinishGame: async () => {},
  hostUpdateSettings: async () => {},
  rollDice: async () => {},
  closeActiveCard: async () => {},
  saveRoomNote: async () => {},
  updatePlayerTokenColor: async () => {},
});

interface TelegramRoomsProviderProps {
  authToken?: string;
  authUserId?: string;
  children: React.ReactNode;
}

export const TelegramRoomsProvider = ({ authToken, authUserId, children }: TelegramRoomsProviderProps) => {
  const [currentRoom, setCurrentRoom] = useState<RoomSnapshot | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [connectionState, setConnectionState] = useState<TelegramRoomsContextValue['connectionState']>('idle');
  const [lastDiceRoll, setLastDiceRoll] = useState<RoomDiceRolledPayload | undefined>(undefined);
  const [lastTokenMove, setLastTokenMove] = useState<RoomTokenMovedPayload | undefined>(undefined);
  const socketRef = useRef<HostRoomSocket | undefined>(undefined);
  const roomIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!authToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = undefined;
      }
      setCurrentRoom(undefined);
      setConnectionState('idle');
      return;
    }

    const socket = createHostRoomSocket(authToken);
    socketRef.current = socket;
    setConnectionState('connecting');

    socket.on('connect', () => {
      setConnectionState('connected');
      if (roomIdRef.current) {
        socket.emit('joinRoom', { roomId: roomIdRef.current });
      }
    });
    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });
    socket.io.on('reconnect_attempt', () => {
      setConnectionState('reconnecting');
    });
    socket.on('roomStateUpdated', (snapshot) => {
      setCurrentRoom(snapshot);
      setError(undefined);
    });
    socket.on('diceRolled', (payload) => {
      setLastDiceRoll(payload);
    });
    socket.on('tokenMoved', (payload) => {
      setLastTokenMove(payload);
    });
    socket.on('roomError', (payload) => {
      setError(payload.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = undefined;
      setConnectionState('idle');
    };
  }, [authToken]);

  const joinRealtimeRoom = (roomId: string) => {
    roomIdRef.current = roomId;
    socketRef.current?.emit('joinRoom', { roomId });
  };

  const withAuth = async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    if (!authToken) {
      setError('Спочатку завершіть авторизацію Telegram.');
      return undefined;
    }
    setError(undefined);
    return action();
  };

  const createRoom = async (boardType: RoomBoardType = 'full') => {
    setIsLoading(true);
    try {
      return await withAuth(async () => {
        const snapshot = await createRoomApi(authToken!, boardType);
        setCurrentRoom(snapshot);
        joinRealtimeRoom(snapshot.room.id);
        return snapshot;
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не вдалося створити кімнату.');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoomByCode = async (code: string) => {
    setIsLoading(true);
    try {
      return await withAuth(async () => {
        const byCode = await getRoomByCodeApi(authToken!, code);
        const snapshot = await joinRoomApi(authToken!, byCode.room.id);
        setCurrentRoom(snapshot);
        joinRealtimeRoom(snapshot.room.id);
        return snapshot;
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Кімнату не знайдено. Перевірте код.');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoomById = async (roomId: string) => {
    setIsLoading(true);
    try {
      return await withAuth(async () => {
        const snapshot = await getRoomByIdApi(authToken!, roomId);
        const joined = await joinRoomApi(authToken!, snapshot.room.id);
        setCurrentRoom(joined);
        joinRealtimeRoom(snapshot.room.id);
        return joined;
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не вдалося відкрити кімнату.');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const currentUserRole = useMemo(() => {
    if (!currentRoom || !authUserId) {
      return undefined;
    }
    return currentRoom.players.find((player) => player.userId === authUserId)?.role;
  }, [currentRoom, authUserId]);

  const runHostAction = async (
    action: () => Promise<RoomSnapshot>,
    socketAction: 'start' | 'pause' | 'resume' | 'finish' | 'updateSettings',
    payload?: Partial<RoomSettings>,
  ) => {
    if (!currentRoom || currentUserRole !== 'host') {
      return;
    }
    try {
      const snapshot = await action();
      setCurrentRoom(snapshot);
      socketRef.current?.emit('hostCommand', { roomId: currentRoom.room.id, action: socketAction, payload });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не вдалося виконати дію ведучого.');
    }
  };

  const hostStartGame = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    await runHostAction(() => hostStartRoomApi(authToken, currentRoom.room.id), 'start');
  };

  const hostPauseGame = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    await runHostAction(() => hostPauseRoomApi(authToken, currentRoom.room.id), 'pause');
  };

  const hostResumeGame = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    await runHostAction(() => hostResumeRoomApi(authToken, currentRoom.room.id), 'resume');
  };

  const hostFinishGame = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    await runHostAction(() => hostFinishRoomApi(authToken, currentRoom.room.id), 'finish');
  };

  const hostUpdateSettings = async (patch: Partial<RoomSettings>) => {
    if (!authToken || !currentRoom || currentUserRole !== 'host') {
      return;
    }
    try {
      const snapshot = await updateRoomSettingsApi(authToken, currentRoom.room.id, patch);
      setCurrentRoom(snapshot);
      socketRef.current?.emit('hostCommand', { roomId: currentRoom.room.id, action: 'updateSettings', payload: patch });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не вдалося оновити параметри кімнати.');
    }
  };

  const rollDice = async () => {
    if (!currentRoom || !authUserId || !socketRef.current) {
      return;
    }
    if (currentRoom.gameState.currentTurnPlayerId !== authUserId) {
      setError('Зараз не ваш хід.');
      return;
    }
    socketRef.current.emit('rollDice', { roomId: currentRoom.room.id });
  };

  const closeActiveCard = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    try {
      const snapshot = await closeRoomCardApi(authToken, currentRoom.room.id);
      setCurrentRoom(snapshot);
      socketRef.current?.emit('closeCard', { roomId: currentRoom.room.id });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не вдалося закрити картку.');
    }
  };

  const saveRoomNote = async ({
    cellNumber,
    note,
    scope,
    targetPlayerId,
  }: {
    cellNumber: number;
    note: string;
    scope: RoomNoteScope;
    targetPlayerId?: string;
  }) => {
    if (!authToken || !currentRoom) {
      return;
    }
    try {
      const snapshot = await saveRoomNoteApi(authToken, currentRoom.room.id, { cellNumber, note, scope, targetPlayerId });
      setCurrentRoom(snapshot);
      socketRef.current?.emit('updateNote', { roomId: currentRoom.room.id, cell: cellNumber, note, scope, targetPlayerId });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не вдалося зберегти нотатку.');
    }
  };

  const updatePlayerTokenColor = async (tokenColor: string) => {
    if (!authToken || !currentRoom) {
      return;
    }
    try {
      const snapshot = await updateRoomPreferencesApi(authToken, currentRoom.room.id, { tokenColor });
      setCurrentRoom(snapshot);
      socketRef.current?.emit('updatePlayerPreferences', { roomId: currentRoom.room.id, tokenColor });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не вдалося оновити колір фішки.');
    }
  };

  const isMyTurn = Boolean(
    currentRoom
      && authUserId
      && currentRoom.gameState.currentTurnPlayerId === authUserId
      && currentRoom.room.status === 'in_progress',
  );

  const value = useMemo<TelegramRoomsContextValue>(
    () => ({
      currentRoom,
      isLoading,
      error,
      connectionState,
      currentUserRole,
      isMyTurn,
      lastDiceRoll,
      lastTokenMove,
      createRoom,
      joinRoomByCode,
      loadRoomById,
      hostStartGame,
      hostPauseGame,
      hostResumeGame,
      hostFinishGame,
      hostUpdateSettings,
      rollDice,
      closeActiveCard,
      saveRoomNote,
      updatePlayerTokenColor,
    }),
    [connectionState, currentRoom, currentUserRole, error, isLoading, isMyTurn, lastDiceRoll, lastTokenMove],
  );

  return <TelegramRoomsContext.Provider value={value}>{children}</TelegramRoomsContext.Provider>;
};

export const useTelegramRooms = (): TelegramRoomsContextValue => useContext(TelegramRoomsContext);
