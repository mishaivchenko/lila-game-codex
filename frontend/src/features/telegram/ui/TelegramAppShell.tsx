import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TelegramAuthProvider, type TelegramAuthContextValue } from '../auth/TelegramAuthContext';
import { TelegramRoomsProvider } from '../rooms/TelegramRoomsContext';
import { useTelegramRuntimeMode } from './useTelegramRuntimeMode';
import { useTelegramFullscreen } from './useTelegramFullscreen';
import { useTelegramWebAppUi } from './useTelegramWebAppUi';
import { useTelegramAuthBootstrap } from './useTelegramAuthBootstrap';
import { useTelegramSessionSync } from './useTelegramSessionSync';
import { resolveAppBootstrapState, bootstrapLabelByState } from './bootstrapState';
import { useViewportHeightFix } from './useViewportHeightFix';

interface TelegramAppShellProps {
  children: React.ReactNode;
}

const createInitialState = (isTelegramMode: boolean): TelegramAuthContextValue => ({
  isTelegramMode,
  status: isTelegramMode ? 'loading' : 'idle',
  appStatus: isTelegramMode ? 'booting' : 'ready',
});

export const TelegramAppShell = ({ children }: TelegramAppShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const telegramMode = useTelegramRuntimeMode(location.pathname);
  const [authState, setAuthState] = useState<TelegramAuthContextValue>(() => createInitialState(telegramMode));
  const [syncBannerVisible, setSyncBannerVisible] = useState(false);
  const { fullscreenRequested, requestFullScreen } = useTelegramFullscreen();
  const autoFullscreenRequestedRef = useRef(false);
  useViewportHeightFix(true);

  useEffect(() => {
    setAuthState((prev) => ({
      ...prev,
      isTelegramMode: telegramMode,
      status: telegramMode ? (prev.status === 'authenticated' ? 'authenticated' : 'loading') : 'idle',
      appStatus: telegramMode
        ? (prev.status === 'authenticated' ? prev.appStatus : 'booting')
        : 'ready',
    }));
  }, [telegramMode]);

  useTelegramWebAppUi({
    telegramMode,
    pathname: location.pathname,
    navigateBack: () => navigate(-1),
  });
  useTelegramAuthBootstrap({ telegramMode, setAuthState });

  useEffect(() => {
    if (!authState.isTelegramMode || authState.status !== 'authenticated' || !authState.token) {
      setSyncBannerVisible(false);
      return;
    }
    setSyncBannerVisible(true);
    const timer = window.setTimeout(() => {
      setSyncBannerVisible(false);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [authState.isTelegramMode, authState.status, authState.token]);

  useEffect(() => {
    if (!telegramMode || fullscreenRequested || autoFullscreenRequestedRef.current) {
      return;
    }
    autoFullscreenRequestedRef.current = true;
    const timer = window.setTimeout(() => {
      void requestFullScreen();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [fullscreenRequested, requestFullScreen, telegramMode]);

  const bootstrapState = resolveAppBootstrapState(authState.status, authState.appStatus, Boolean(authState.token));

  const shellClassName = telegramMode
    ? 'tma-shell mx-auto flex h-[var(--app-height,100dvh)] min-h-[var(--app-height,100dvh)] w-full max-w-[1600px] flex-col overflow-hidden px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4'
    : 'mx-auto flex h-[var(--app-height,100dvh)] min-h-[var(--app-height,100dvh)] w-full flex-col overflow-hidden';

  return (
    <TelegramAuthProvider value={authState}>
      <TelegramRoomsProvider authToken={authState.token} authUserId={authState.user?.id}>
        <TelegramSessionSyncBridge />
        <div className={shellClassName} data-telegram-mode={telegramMode ? 'true' : 'false'} data-testid="telegram-app-shell-root">
          {authState.isTelegramMode && !fullscreenRequested && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  void requestFullScreen();
                }}
                className="lila-secondary-button px-3 py-2 text-xs font-medium"
              >
                Open full screen
              </button>
            </div>
          )}

          <AnimatePresence>
            {authState.isTelegramMode && (bootstrapState === 'initializing' || (bootstrapState === 'syncing' && syncBannerVisible)) && (
              <motion.div
                key="telegram-loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                className="lila-list-card mb-3 px-4 py-3 text-xs text-[var(--lila-text-muted)]"
              >
                <div className="space-y-1">
                  <p>{bootstrapLabelByState[bootstrapState]}</p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--lila-surface-muted)]">
                    <motion.div
                      className="h-full bg-[var(--lila-accent)]"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: 'linear' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {authState.isTelegramMode && authState.status === 'authenticated' && !authState.token && (
            <div className="mb-3 rounded-2xl border border-amber-300/70 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
              Сервер тимчасово недоступний. Працюємо в локальному режимі Telegram runtime: історія, кімнати та синхронізація між
              пристроями можуть бути недоступні до відновлення backend.
            </div>
          )}

          {authState.isTelegramMode && authState.appStatus === 'networkError' && (
            <div className="mb-3 rounded-2xl border border-amber-300/70 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
              Проблема з мережею або API. Ви можете продовжити локальну гру, але online-кімнати тимчасово вимкнені.
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {authState.isTelegramMode && authState.status === 'error' ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                <h2 className="text-sm font-semibold">Помилка авторизації</h2>
                <p className="mt-1 text-sm">{authState.error}</p>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </TelegramRoomsProvider>
    </TelegramAuthProvider>
  );
};

const TelegramSessionSyncBridge = () => {
  useTelegramSessionSync();
  return null;
};
