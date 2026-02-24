import { useMemo } from 'react';
import { isTelegramWebApp, shouldBypassTelegramAuthForLocalDev } from '../telegramWebApp';

export const useTelegramRuntimeMode = (pathname: string): boolean => {
  const routeForcesTelegram = pathname === '/telegram';
  return useMemo(() => {
    // Local development should stay in regular web mode on the root route.
    if (!routeForcesTelegram && shouldBypassTelegramAuthForLocalDev()) {
      return false;
    }

    return routeForcesTelegram || isTelegramWebApp();
  }, [routeForcesTelegram]);
};
