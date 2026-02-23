import { createContext, useContext, useMemo, useState } from 'react';
import type { GameRoom } from './roomsApi';
import { createRoomApi, getRoomByCodeApi } from './roomsApi';

interface TelegramRoomsContextValue {
  currentRoom?: GameRoom;
  isLoading: boolean;
  error?: string;
  createRoom: () => Promise<void>;
  joinRoomByCode: (code: string) => Promise<void>;
}

const TelegramRoomsContext = createContext<TelegramRoomsContextValue>({
  isLoading: false,
  createRoom: async () => {},
  joinRoomByCode: async () => {},
});

interface TelegramRoomsProviderProps {
  authToken?: string;
  children: React.ReactNode;
}

export const TelegramRoomsProvider = ({ authToken, children }: TelegramRoomsProviderProps) => {
  const [currentRoom, setCurrentRoom] = useState<GameRoom | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const createRoom = async () => {
    if (!authToken) {
      setError('Спочатку завершіть авторизацію Telegram.');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      const room = await createRoomApi(authToken);
      setCurrentRoom(room);
    } catch {
      setError('Не вдалося створити кімнату.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoomByCode = async (code: string) => {
    if (!authToken) {
      setError('Спочатку завершіть авторизацію Telegram.');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      const room = await getRoomByCodeApi(authToken, code);
      setCurrentRoom(room);
    } catch {
      setError('Кімнату не знайдено. Перевірте код.');
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo<TelegramRoomsContextValue>(
    () => ({
      currentRoom,
      isLoading,
      error,
      createRoom,
      joinRoomByCode,
    }),
    [currentRoom, isLoading, error],
  );

  return <TelegramRoomsContext.Provider value={value}>{children}</TelegramRoomsContext.Provider>;
};

export const useTelegramRooms = (): TelegramRoomsContextValue => useContext(TelegramRoomsContext);
