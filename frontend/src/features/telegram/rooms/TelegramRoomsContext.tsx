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
  getRoomByIdApi,
  joinRoomByCodeApi,
  listMyRoomsApi,
  hostFinishRoomApi,
  hostPauseRoomApi,
  hostResumeRoomApi,
  hostStartRoomApi,
  rollRoomDiceApi,
  joinRoomApi,
  saveRoomNoteApi,
  updateRoomPreferencesApi,
  updateRoomSettingsApi,
} from './roomsApi';

interface TelegramRoomsContextValue {
  currentRoom?: RoomSnapshot;
  myRooms: RoomSnapshot[];
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
  refreshMyRooms: () => Promise<void>;
  hostStartGame: () => Promise<void>;
  hostPauseGame: () => Promise<void>;
  hostResumeGame: () => Promise<void>;
  hostFinishGame: () => Promise<void>;
  hostUpdateSettings: (patch: Partial<RoomSettings>) => Promise<void>;
  rollDice: () => Promise<void>;
  closeActiveCard: () => Promise<void>;
  saveRoomNote: (payload: { cellNumber: number; note: string; scope: RoomNoteScope; targetPlayerId?: string }) => Promise<void>;
  updatePlayerTokenColor: (tokenColor: string) => Promise<void>;
  clearCurrentRoom: () => void;
}

const TelegramRoomsContext = createContext<TelegramRoomsContextValue>({
  isLoading: false,
  myRooms: [],
  connectionState: 'idle',
  isMyTurn: false,
  createRoom: async () => undefined,
  joinRoomByCode: async () => undefined,
  loadRoomById: async () => undefined,
  refreshMyRooms: async () => {},
  hostStartGame: async () => {},
  hostPauseGame: async () => {},
  hostResumeGame: async () => {},
  hostFinishGame: async () => {},
  hostUpdateSettings: async () => {},
  rollDice: async () => {},
  closeActiveCard: async () => {},
  saveRoomNote: async () => {},
  updatePlayerTokenColor: async () => {},
  clearCurrentRoom: () => {},
});

interface TelegramRoomsProviderProps {
  authToken?: string;
  authUserId?: string;
  children: React.ReactNode;
}

export const TelegramRoomsProvider = ({ authToken, authUserId, children }: TelegramRoomsProviderProps) => {
  const [currentRoom, setCurrentRoom] = useState<RoomSnapshot | undefined>(undefined);
  const [myRooms, setMyRooms] = useState<RoomSnapshot[]>([]);
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
      setMyRooms([]);
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

  useEffect(() => {
    if (!authToken) {
      setMyRooms([]);
      return;
    }
    void refreshMyRooms();
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !currentRoom?.room.id) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      void getRoomByIdApi(authToken, currentRoom.room.id)
        .then((snapshot) => {
          setCurrentRoom(snapshot);
        })
        .catch(() => {
          // keep current snapshot while temporary network glitches happen
        });
    }, 2500);
    return () => window.clearInterval(interval);
  }, [authToken, currentRoom?.room.id]);

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

  const refreshMyRooms = async () => {
    try {
      const rooms = await withAuth(async () => listMyRoomsApi(authToken!));
      if (rooms) {
        setMyRooms(rooms);
      }
    } catch {
      // Keep UI responsive if rooms feed is temporarily unavailable.
    }
  };

  const createRoom = async (boardType: RoomBoardType = 'full') => {
    setIsLoading(true);
    try {
      return await withAuth(async () => {
        const snapshot = await createRoomApi(authToken!, boardType);
        setCurrentRoom(snapshot);
        await refreshMyRooms();
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
        const snapshot = await joinRoomByCodeApi(authToken!, code);
        setCurrentRoom(snapshot);
        await refreshMyRooms();
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
        if (snapshot.room.status === 'finished') {
          setCurrentRoom(snapshot);
          await refreshMyRooms();
          return snapshot;
        }
        const joined = await joinRoomApi(authToken!, snapshot.room.id);
        setCurrentRoom(joined);
        await refreshMyRooms();
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
    if (currentRoom.room.hostUserId === authUserId) {
      return 'host';
    }
    return currentRoom.players.find((player) => player.userId === authUserId)?.role;
  }, [currentRoom, authUserId]);

  const runHostAction = async (
    action: () => Promise<RoomSnapshot>,
    socketAction: 'start' | 'pause' | 'resume' | 'finish' | 'updateSettings',
    payload?: Partial<RoomSettings>,
  ) => {
    const isHostByRoom = currentRoom?.room.hostUserId === authUserId;
    if (!currentRoom || !isHostByRoom) {
      setError('Дія доступна лише ведучому поточної кімнати.');
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
    roomIdRef.current = undefined;
    setCurrentRoom(undefined);
    setLastDiceRoll(undefined);
    setLastTokenMove(undefined);
    await refreshMyRooms();
  };

  const hostUpdateSettings = async (patch: Partial<RoomSettings>) => {
    const isHostByRoom = currentRoom?.room.hostUserId === authUserId;
    if (!authToken || !currentRoom || !isHostByRoom) {
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
    if (!currentRoom || !authUserId || !authToken) {
      return;
    }
    if (currentRoom.room.status !== 'in_progress') {
      setError('Гру ще не розпочато або вона на паузі.');
      return;
    }
    if (currentRoom.room.hostUserId === authUserId) {
      setError('Ведучий не кидає кубики. Кидок доступний лише активному гравцю.');
      return;
    }
    try {
      const snapshot = await rollRoomDiceApi(authToken, currentRoom.room.id);
      setCurrentRoom(snapshot);
      socketRef.current?.emit('rollDice', { roomId: currentRoom.room.id });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не вдалося кинути кубики.');
    }
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

  const clearCurrentRoom = () => {
    roomIdRef.current = undefined;
    setCurrentRoom(undefined);
    setError(undefined);
    setLastDiceRoll(undefined);
    setLastTokenMove(undefined);
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
      myRooms,
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
      refreshMyRooms,
      hostStartGame,
      hostPauseGame,
      hostResumeGame,
      hostFinishGame,
      hostUpdateSettings,
      rollDice,
      closeActiveCard,
      saveRoomNote,
      updatePlayerTokenColor,
      clearCurrentRoom,
    }),
    [connectionState, currentRoom, currentUserRole, error, isLoading, isMyTurn, lastDiceRoll, lastTokenMove, myRooms],
  );

  return <TelegramRoomsContext.Provider value={value}>{children}</TelegramRoomsContext.Provider>;
};

export const useTelegramRooms = (): TelegramRoomsContextValue => useContext(TelegramRoomsContext);
