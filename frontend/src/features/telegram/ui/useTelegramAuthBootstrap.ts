import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { authenticateTelegramWebApp, fetchCurrentUser } from '../auth/telegramAuthApi';
import type { TelegramAuthContextValue } from '../auth/TelegramAuthContext';
import { getTelegramInitData, isLocalDevHost, shouldBypassTelegramAuthForLocalDev } from '../telegramWebApp';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveTelegramInitData = async (): Promise<string> => {
  const maxAttempts = 12;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const initData = getTelegramInitData();
    if (initData.includes('hash=')) {
      return initData;
    }
    await sleep(150);
  }

  return '';
};

interface UseTelegramAuthBootstrapParams {
  telegramMode: boolean;
  setAuthState: Dispatch<SetStateAction<TelegramAuthContextValue>>;
}

const createLocalDevAuthState = (): TelegramAuthContextValue => ({
  isTelegramMode: true,
  status: 'authenticated',
  token: 'local-dev-token',
  user: {
    id: 'local-dev-user',
    telegramId: 'local-dev',
    displayName: 'Local Dev',
    username: 'local-dev',
    locale: 'uk',
    role: 'SUPER_ADMIN',
    isAdmin: true,
    isSuperAdmin: true,
  },
});

export const useTelegramAuthBootstrap = ({
  telegramMode,
  setAuthState,
}: UseTelegramAuthBootstrapParams) => {
  useEffect(() => {
    if (!telegramMode) {
      return;
    }

    let cancelled = false;
    setAuthState((prev) => ({ ...prev, isTelegramMode: true, status: 'loading', error: undefined }));

    const allowLocalBypass = shouldBypassTelegramAuthForLocalDev();
    const allowLocalFallback = isLocalDevHost();

    if (allowLocalBypass) {
      setAuthState(createLocalDevAuthState());
      return;
    }

    void (async () => {
      const initData = await resolveTelegramInitData();

      if (cancelled) {
        return;
      }

      if (!initData) {
        if (allowLocalFallback) {
          setAuthState(createLocalDevAuthState());
          return;
        }

        setAuthState({
          isTelegramMode: true,
          status: 'error',
          error: 'Не вдалося отримати Telegram initData. Відкрийте застосунок через бота.',
        });
        return;
      }

      try {
        const result = await authenticateTelegramWebApp(initData);
        if (cancelled) {
          return;
        }

        let currentUser = result.user;
        try {
          currentUser = await fetchCurrentUser(result.token);
        } catch {
          // Keep the auth bootstrap resilient: if /me fails temporarily, use auth payload.
        }

        setAuthState({
          isTelegramMode: true,
          status: 'authenticated',
          token: result.token,
          user: currentUser,
        });
      } catch {
        if (cancelled) {
          return;
        }

        if (allowLocalFallback) {
          setAuthState(createLocalDevAuthState());
          return;
        }

        setAuthState({
          isTelegramMode: true,
          status: 'error',
          error: 'Telegram-авторизація не пройшла перевірку. Спробуйте відкрити Mini App повторно.',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuthState, telegramMode]);
};
