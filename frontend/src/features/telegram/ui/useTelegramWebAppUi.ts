import { useEffect } from 'react';
import {
  applyTelegramThemeToRoot,
  getTelegramWebApp,
} from '../telegramWebApp';

interface UseTelegramWebAppUiParams {
  telegramMode: boolean;
  pathname: string;
  navigateBack: () => void;
}

export const useTelegramWebAppUi = ({
  telegramMode,
  pathname,
  navigateBack,
}: UseTelegramWebAppUiParams) => {
  useEffect(() => {
    if (!telegramMode) {
      return;
    }

    const webApp = getTelegramWebApp();
    webApp?.ready();
    webApp?.expand();
    applyTelegramThemeToRoot(webApp?.themeParams, webApp?.colorScheme);
    document.documentElement.setAttribute('data-tg-mode', 'true');

    const backButton = webApp?.BackButton;
    const handleBack = () => navigateBack();
    const handleThemeChanged = () => applyTelegramThemeToRoot(webApp?.themeParams, webApp?.colorScheme);
    const isHomeRoute = pathname === '/' || pathname === '/telegram';

    if (backButton) {
      if (isHomeRoute) {
        backButton.hide();
      } else {
        backButton.show();
        backButton.onClick(handleBack);
      }
    }
    webApp?.onEvent?.('themeChanged', handleThemeChanged);

    return () => {
      document.documentElement.removeAttribute('data-tg-mode');
      webApp?.offEvent?.('themeChanged', handleThemeChanged);
      if (backButton) {
        backButton.offClick(handleBack);
      }
    };
  }, [navigateBack, pathname, telegramMode]);
};
