import { useCallback, useState } from 'react';
import { getTelegramWebApp } from '../telegramWebApp';

export const useTelegramFullscreen = () => {
  const [fullscreenRequested, setFullscreenRequested] = useState(() => {
    const webApp = getTelegramWebApp();
    return Boolean(webApp?.isExpanded || webApp?.isFullscreen);
  });

  const requestFullScreen = useCallback(async () => {
    const webApp = getTelegramWebApp();
    webApp?.requestFullscreen?.();
    webApp?.expand();

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
      setFullscreenRequested(true);
    }
  }, []);

  return {
    fullscreenRequested,
    requestFullScreen,
  };
};
