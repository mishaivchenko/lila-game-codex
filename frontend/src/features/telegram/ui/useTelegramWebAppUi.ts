import { useEffect } from 'react';
import {
  applyTelegramThemeToRoot,
  getTelegramWebApp,
} from '../telegramWebApp';

interface UseTelegramWebAppUiParams {
  telegramMode: boolean;
  pathname: string;
  navigateBack: () => void;
  onInvite?: () => void;
}

export const useTelegramWebAppUi = ({
  telegramMode,
  pathname,
  navigateBack,
  onInvite,
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
    const mainButton = webApp?.MainButton;
    const handleBack = () => navigateBack();
    const handleMain = () => onInvite?.();
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
    if (mainButton) {
      if (isHomeRoute && onInvite) {
        mainButton.setText?.('Invite');
        mainButton.enable?.();
        mainButton.show();
        mainButton.onClick(handleMain);
      } else {
        mainButton.hide();
      }
    }
    webApp?.onEvent?.('themeChanged', handleThemeChanged);

    return () => {
      document.documentElement.removeAttribute('data-tg-mode');
      webApp?.offEvent?.('themeChanged', handleThemeChanged);
      if (backButton) {
        backButton.offClick(handleBack);
      }
      if (mainButton) {
        mainButton.offClick(handleMain);
      }
    };
  }, [navigateBack, onInvite, pathname, telegramMode]);
};
