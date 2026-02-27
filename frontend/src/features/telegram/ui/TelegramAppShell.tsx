import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TelegramAuthProvider, type TelegramAuthContextValue } from '../auth/TelegramAuthContext';
import { TelegramRoomsProvider } from '../rooms/TelegramRoomsContext';
import { useTelegramRuntimeMode } from './useTelegramRuntimeMode';
import { useTelegramFullscreen } from './useTelegramFullscreen';
import { useTelegramWebAppUi } from './useTelegramWebAppUi';
import { useTelegramAuthBootstrap } from './useTelegramAuthBootstrap';
import { useTelegramSessionSync } from './useTelegramSessionSync';

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
  const { fullscreenRequested, requestFullScreen } = useTelegramFullscreen();

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

  const shellClassName = telegramMode
    ? 'tma-shell mx-auto min-h-[100dvh] w-full max-w-[1240px] bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4'
    : '';

  return (
    <TelegramAuthProvider value={authState}>
      <TelegramRoomsProvider authToken={authState.token} authUserId={authState.user?.id}>
        <TelegramSessionSyncBridge />
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

const TelegramSessionSyncBridge = () => {
  useTelegramSessionSync();
  return null;
};
