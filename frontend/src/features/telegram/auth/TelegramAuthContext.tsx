import { createContext, useContext } from 'react';
import type { TelegramAppUser } from './telegramAuthApi';

export type TelegramAuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface TelegramAuthContextValue {
  isTelegramMode: boolean;
  status: TelegramAuthStatus;
  user?: TelegramAppUser;
  token?: string;
  error?: string;
}

const TelegramAuthContext = createContext<TelegramAuthContextValue>({
  isTelegramMode: false,
  status: 'idle',
});

interface TelegramAuthProviderProps {
  value: TelegramAuthContextValue;
  children: React.ReactNode;
}

export const TelegramAuthProvider = ({ value, children }: TelegramAuthProviderProps) => {
  return <TelegramAuthContext.Provider value={value}>{children}</TelegramAuthContext.Provider>;
};

export const useTelegramAuth = (): TelegramAuthContextValue => useContext(TelegramAuthContext);
