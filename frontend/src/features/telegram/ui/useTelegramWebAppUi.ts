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
    applyTelegramThemeToRoot(webApp?.themeParams);

    const backButton = webApp?.BackButton;
    const handleBack = () => navigateBack();

    if (backButton) {
      if (pathname === '/' || pathname === '/telegram') {
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
  }, [navigateBack, pathname, telegramMode]);
};

