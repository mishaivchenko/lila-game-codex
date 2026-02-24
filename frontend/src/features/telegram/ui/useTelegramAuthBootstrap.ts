import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { authenticateTelegramWebApp } from '../auth/telegramAuthApi';
import type { TelegramAuthContextValue } from '../auth/TelegramAuthContext';
import { getTelegramInitData } from '../telegramWebApp';

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

    void (async () => {
      const initData = await resolveTelegramInitData();

      if (cancelled) {
        return;
      }

      if (!initData) {
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

        setAuthState({
          isTelegramMode: true,
          status: 'authenticated',
          token: result.token,
          user: result.user,
        });
      } catch {
        if (cancelled) {
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
