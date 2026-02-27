import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { authenticateTelegramWebApp, fetchCurrentUser } from '../auth/telegramAuthApi';
import type { TelegramAuthContextValue } from '../auth/TelegramAuthContext';
import { getTelegramInitData, getTelegramWebApp, isLocalDevHost, shouldBypassTelegramAuthForLocalDev } from '../telegramWebApp';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const AUTH_TOKEN_STORAGE_KEY = 'lila:tma-auth-token';
const persistAuthToken = (token: string | undefined) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};
const readPersistedAuthToken = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? undefined;
};

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

const isBackendUnavailableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes('502') || message.includes('503') || message.includes('gateway');
};

const createTelegramRuntimeFallbackState = (): TelegramAuthContextValue | undefined => {
  const webApp = getTelegramWebApp();
  const unsafe = webApp?.initDataUnsafe;
  const userPayload = unsafe?.user as {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  } | undefined;
  if (!userPayload?.id) {
    return undefined;
  }
  const displayName = [userPayload.first_name, userPayload.last_name].filter(Boolean).join(' ').trim()
    || userPayload.username
    || `telegram-${userPayload.id}`;
  return {
    isTelegramMode: true,
    status: 'authenticated',
    token: undefined,
    user: {
      id: `fallback-${userPayload.id}`,
      telegramId: String(userPayload.id),
      displayName,
      username: userPayload.username,
      firstName: userPayload.first_name,
      lastName: userPayload.last_name,
      locale: userPayload.language_code,
      role: 'USER',
      isAdmin: false,
      isSuperAdmin: false,
      canHostCurrentChat: false,
    },
  };
};

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
        persistAuthToken(result.token);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (allowLocalFallback) {
          setAuthState(createLocalDevAuthState());
          return;
        }

        const persistedToken = readPersistedAuthToken();
        if (persistedToken) {
          try {
            const currentUser = await fetchCurrentUser(persistedToken);
            if (cancelled) {
              return;
            }
            setAuthState({
              isTelegramMode: true,
              status: 'authenticated',
              token: persistedToken,
              user: currentUser,
            });
            return;
          } catch {
            persistAuthToken(undefined);
          }
        }

        if (isBackendUnavailableError(error)) {
          const runtimeFallbackState = createTelegramRuntimeFallbackState();
          if (runtimeFallbackState) {
            setAuthState(runtimeFallbackState);
            return;
          }
        }

        setAuthState({
          isTelegramMode: true,
          status: 'error',
          error:
            error instanceof Error && error.message
              ? error.message
              : 'Telegram-авторизація не пройшла перевірку. Якщо проблема повторюється, перевірте bot token, DATABASE_URL та актуальність міграцій на VPS.',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuthState, telegramMode]);
};
