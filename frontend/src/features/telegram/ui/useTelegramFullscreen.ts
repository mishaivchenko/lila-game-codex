import { useCallback, useEffect, useState } from 'react';
import { getTelegramWebApp } from '../telegramWebApp';

export const useTelegramFullscreen = () => {
  const resolveCurrentFullscreen = () => {
    const webApp = getTelegramWebApp();
    return Boolean(webApp?.isFullscreen || document.fullscreenElement);
  };
  const [fullscreenRequested, setFullscreenRequested] = useState(() => {
    return resolveCurrentFullscreen();
  });

  const requestFullScreen = useCallback(async () => {
    const webApp = getTelegramWebApp();
    webApp?.expand();

    try {
      await Promise.resolve(webApp?.requestFullscreen?.());
    } catch {
      // Fall through to browser fullscreen fallback when Telegram runtime rejects the request.
    }

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
      // Keep UI usable even if browser denies fullscreen request.
    } finally {
      setFullscreenRequested(resolveCurrentFullscreen());
      window.setTimeout(() => {
        setFullscreenRequested(resolveCurrentFullscreen());
      }, 180);
    }
  }, []);

  useEffect(() => {
    const webApp = getTelegramWebApp();
    const syncState = () => {
      setFullscreenRequested(resolveCurrentFullscreen());
    };
    webApp?.onEvent?.('viewportChanged', syncState);
    webApp?.onEvent?.('fullscreenChanged', syncState);
    document.addEventListener('fullscreenchange', syncState);
    syncState();
    return () => {
      webApp?.offEvent?.('viewportChanged', syncState);
      webApp?.offEvent?.('fullscreenChanged', syncState);
      document.removeEventListener('fullscreenchange', syncState);
    };
  }, []);

  return {
    fullscreenRequested,
    requestFullScreen,
  };
};
