declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramWebAppButton {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: Record<string, unknown>;
  colorScheme?: 'light' | 'dark';
  themeParams?: TelegramThemeParams;
  isExpanded?: boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  BackButton?: TelegramWebAppButton;
}

const hasTelegramObject = (): boolean => Boolean(window.Telegram?.WebApp);

export const isTelegramWebApp = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (import.meta.env.VITE_FORCE_TELEGRAM_MODE === 'true') {
    return true;
  }

  if (hasTelegramObject()) {
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  return params.has('tgWebAppData') || params.has('tgWebAppStartParam');
};

export const getTelegramWebApp = (): TelegramWebApp | undefined => {
  return window.Telegram?.WebApp;
};

export const getTelegramInitData = (): string => {
  const webApp = getTelegramWebApp();
  if (webApp?.initData) {
    return webApp.initData;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('tgWebAppData') ?? '';
};

export const applyTelegramThemeToRoot = (theme?: TelegramThemeParams): void => {
  if (!theme) {
    return;
  }

  const root = document.documentElement;
  if (theme.bg_color) {
    root.style.setProperty('--tg-bg-color', theme.bg_color);
  }
  if (theme.secondary_bg_color) {
    root.style.setProperty('--tg-secondary-bg-color', theme.secondary_bg_color);
  }
  if (theme.text_color) {
    root.style.setProperty('--tg-text-color', theme.text_color);
  }
  if (theme.hint_color) {
    root.style.setProperty('--tg-hint-color', theme.hint_color);
  }
  if (theme.button_color) {
    root.style.setProperty('--tg-button-color', theme.button_color);
  }
  if (theme.button_text_color) {
    root.style.setProperty('--tg-button-text-color', theme.button_text_color);
  }
};
