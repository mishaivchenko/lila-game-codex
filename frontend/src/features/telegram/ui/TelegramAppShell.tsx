import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TelegramAuthProvider, type TelegramAuthContextValue } from '../auth/TelegramAuthContext';
import { authenticateTelegramWebApp } from '../auth/telegramAuthApi';
import { TelegramRoomsProvider } from '../rooms/TelegramRoomsContext';
import {
  applyTelegramThemeToRoot,
  getTelegramInitData,
  getTelegramWebApp,
  isTelegramWebApp,
} from '../telegramWebApp';

interface TelegramAppShellProps {
  children: React.ReactNode;
}

const createInitialState = (isTelegramMode: boolean): TelegramAuthContextValue => ({
  isTelegramMode,
  status: isTelegramMode ? 'loading' : 'idle',
});

export const TelegramAppShell = ({ children }: TelegramAppShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeForcesTelegram = location.pathname === '/telegram';
  const telegramMode = useMemo(() => routeForcesTelegram || isTelegramWebApp(), [routeForcesTelegram]);
  const [authState, setAuthState] = useState<TelegramAuthContextValue>(() => createInitialState(telegramMode));
  const [fullscreenRequested, setFullscreenRequested] = useState(false);

  useEffect(() => {
    setAuthState((prev) => ({
      ...prev,
      isTelegramMode: telegramMode,
      status: telegramMode ? (prev.status === 'authenticated' ? 'authenticated' : 'loading') : 'idle',
    }));
  }, [telegramMode]);

  const requestFullScreen = async () => {
    const webApp = getTelegramWebApp();
    webApp?.requestFullscreen?.();
    webApp?.expand();

    // Fallback for desktop/web contexts where WebApp expand is not enough.
    if (document.fullscreenElement) {
      setFullscreenRequested(true);
      return;
    }

    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    try {
      if (root.requestFullscreen) {
        await root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      } else if (root.msRequestFullscreen) {
        await root.msRequestFullscreen();
      }
    } catch {
      // Non-blocking UX: keep app usable even if fullscreen is denied by browser policy.
    } finally {
      setFullscreenRequested(true);
    }
  };

  useEffect(() => {
    if (!telegramMode) {
      return;
    }

    const webApp = getTelegramWebApp();
    webApp?.ready();
    webApp?.expand();
    applyTelegramThemeToRoot(webApp?.themeParams);

    const backButton = webApp?.BackButton;
    const handleBack = () => navigate(-1);

    if (backButton) {
      if (location.pathname === '/' || location.pathname === '/telegram') {
        backButton.hide();
      } else {
        backButton.show();
        backButton.onClick(handleBack);
      }
    }

    return () => {
      if (backButton) {
        backButton.offClick(handleBack);
      }
    };
  }, [location.pathname, navigate, telegramMode]);

  useEffect(() => {
    if (!telegramMode) {
      return;
    }

    let cancelled = false;
    const initData = getTelegramInitData();

    if (!initData) {
      setAuthState({
        isTelegramMode: true,
        status: 'error',
        error: 'Не вдалося отримати Telegram initData. Відкрийте застосунок через бота.',
      });
      return;
    }

    setAuthState((prev) => ({ ...prev, isTelegramMode: true, status: 'loading', error: undefined }));

    void authenticateTelegramWebApp(initData)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setAuthState({
          isTelegramMode: true,
          status: 'authenticated',
          token: result.token,
          user: result.user,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setAuthState({
          isTelegramMode: true,
          status: 'error',
          error: 'Telegram-авторизація не пройшла перевірку. Спробуйте відкрити Mini App повторно.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [telegramMode]);

  const shellClassName = telegramMode
    ? 'mx-auto min-h-screen w-full max-w-[560px] bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4'
    : '';

  return (
    <TelegramAuthProvider value={authState}>
      <TelegramRoomsProvider authToken={authState.token}>
        <div className={shellClassName} data-telegram-mode={telegramMode ? 'true' : 'false'}>
          {authState.isTelegramMode && !fullscreenRequested && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  void requestFullScreen();
                }}
                className="rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-3 py-1.5 text-xs font-medium text-[var(--lila-text-primary)] shadow-sm transition hover:bg-[var(--lila-surface-muted)]"
              >
                Open full screen
              </button>
            </div>
          )}

          <AnimatePresence>
            {authState.isTelegramMode && authState.status === 'loading' && (
              <motion.div
                key="telegram-loading"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mb-3 rounded-xl border border-[#e9d8cc] bg-white/80 px-3 py-2 text-xs text-[var(--lila-text-muted)]"
              >
                Підключення Telegram Mini App...
              </motion.div>
            )}
          </AnimatePresence>

          {authState.isTelegramMode && authState.status === 'error' ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <h2 className="text-sm font-semibold">Помилка авторизації</h2>
              <p className="mt-1 text-sm">{authState.error}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </TelegramRoomsProvider>
    </TelegramAuthProvider>
  );
};
