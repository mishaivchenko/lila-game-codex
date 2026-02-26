import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { RoomBoardType, RoomSnapshot, HostRoomSocket } from './roomsApi';
import {
  createRoomApi,
  createHostRoomSocket,
  getRoomByCodeApi,
  getRoomByIdApi,
  hostPauseRoomApi,
  hostResumeRoomApi,
  hostFinishRoomApi,
  hostStartRoomApi,
  joinRoomApi,
} from './roomsApi';

interface TelegramRoomsContextValue {
  currentRoom?: RoomSnapshot;
  isLoading: boolean;
  error?: string;
  connectionState: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  currentUserRole?: 'host' | 'player';
  isMyTurn: boolean;
  createRoom: (boardType?: RoomBoardType) => Promise<RoomSnapshot | undefined>;
  joinRoomByCode: (code: string) => Promise<RoomSnapshot | undefined>;
  loadRoomById: (roomId: string) => Promise<RoomSnapshot | undefined>;
  hostStartGame: () => Promise<void>;
  hostPauseGame: () => Promise<void>;
  hostResumeGame: () => Promise<void>;
  hostFinishGame: () => Promise<void>;
  rollDice: () => Promise<void>;
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
  rollDice: async () => {},
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
  const socketRef = useRef<HostRoomSocket | undefined>(undefined);
  const roomIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!authToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = undefined;
      }
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
    if (!socketRef.current) {
      return;
    }
    socketRef.current.emit('joinRoom', { roomId });
  };

  const createRoom = async (boardType: RoomBoardType = 'full') => {
    if (!authToken) {
      setError('Спочатку завершіть авторизацію Telegram.');
      return undefined;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const snapshot = await createRoomApi(authToken, boardType);
      setCurrentRoom(snapshot);
      joinRealtimeRoom(snapshot.room.id);
      return snapshot;
    } catch {
      setError('Не вдалося створити кімнату.');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoomByCode = async (code: string) => {
    if (!authToken) {
      setError('Спочатку завершіть авторизацію Telegram.');
      return undefined;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const byCode = await getRoomByCodeApi(authToken, code);
      const snapshot = await joinRoomApi(authToken, byCode.room.id);
      setCurrentRoom(snapshot);
      joinRealtimeRoom(snapshot.room.id);
      return snapshot;
    } catch {
      setError('Кімнату не знайдено. Перевірте код.');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoomById = async (roomId: string) => {
    if (!authToken) {
      return undefined;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const snapshot = await getRoomByIdApi(authToken, roomId);
      const joined = await joinRoomApi(authToken, snapshot.room.id);
      setCurrentRoom(joined);
      joinRealtimeRoom(snapshot.room.id);
      return joined;
    } catch {
      setError('Не вдалося відкрити кімнату.');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const hostStartGame = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    try {
      const snapshot = await hostStartRoomApi(authToken, currentRoom.room.id);
      setCurrentRoom(snapshot);
      socketRef.current?.emit('hostCommand', { roomId: currentRoom.room.id, action: 'start' });
    } catch {
      setError('Не вдалося запустити гру.');
    }
  };

  const hostFinishGame = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    try {
      const snapshot = await hostFinishRoomApi(authToken, currentRoom.room.id);
      setCurrentRoom(snapshot);
      socketRef.current?.emit('hostCommand', { roomId: currentRoom.room.id, action: 'finish' });
    } catch {
      setError('Не вдалося завершити гру.');
    }
  };

  const hostPauseGame = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    try {
      const snapshot = await hostPauseRoomApi(authToken, currentRoom.room.id);
      setCurrentRoom(snapshot);
      socketRef.current?.emit('hostCommand', { roomId: currentRoom.room.id, action: 'pause' });
    } catch {
      setError('Не вдалося поставити гру на паузу.');
    }
  };

  const hostResumeGame = async () => {
    if (!authToken || !currentRoom) {
      return;
    }
    try {
      const snapshot = await hostResumeRoomApi(authToken, currentRoom.room.id);
      setCurrentRoom(snapshot);
      socketRef.current?.emit('hostCommand', { roomId: currentRoom.room.id, action: 'resume' });
    } catch {
      setError('Не вдалося відновити гру.');
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

  const currentUserRole = useMemo(() => {
    if (!currentRoom || !authUserId) {
      return undefined;
    }
    return currentRoom.players.find((player) => player.userId === authUserId)?.role;
  }, [currentRoom, authUserId]);

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
      createRoom,
      joinRoomByCode,
      loadRoomById,
      hostStartGame,
      hostPauseGame,
      hostResumeGame,
      hostFinishGame,
      rollDice,
    }),
    [currentRoom, isLoading, error, connectionState, currentUserRole, isMyTurn],
  );

  return <TelegramRoomsContext.Provider value={value}>{children}</TelegramRoomsContext.Provider>;
};

export const useTelegramRooms = (): TelegramRoomsContextValue => useContext(TelegramRoomsContext);
