import { useMemo } from 'react';
import { isTelegramWebApp } from '../telegramWebApp';

export const useTelegramRuntimeMode = (pathname: string): boolean => {
  const routeForcesTelegram = pathname === '/telegram';
  return useMemo(() => routeForcesTelegram || isTelegramWebApp(), [routeForcesTelegram]);
};

