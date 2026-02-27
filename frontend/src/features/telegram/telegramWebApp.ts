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
  setText?: (text: string) => void;
  enable?: () => void;
  disable?: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
}

export interface TelegramWebAppHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

export type TelegramWebAppEvent =
  | 'themeChanged'
  | 'viewportChanged'
  | 'mainButtonClicked'
  | 'backButtonClicked';

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: Record<string, unknown>;
  colorScheme?: 'light' | 'dark';
  themeParams?: TelegramThemeParams;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  ready: () => void;
  expand: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  openTelegramLink?: (url: string) => void;
  shareURL?: (url: string, text?: string) => void;
  HapticFeedback?: TelegramWebAppHapticFeedback;
  MainButton?: TelegramWebAppButton;
  close: () => void;
  BackButton?: TelegramWebAppButton;
  onEvent?: (eventType: TelegramWebAppEvent, eventHandler: () => void) => void;
  offEvent?: (eventType: TelegramWebAppEvent, eventHandler: () => void) => void;
}

export interface TelegramThemeSnapshot {
  colorScheme?: 'light' | 'dark';
  bgColor?: string;
  secondaryBgColor?: string;
  textColor?: string;
  hintColor?: string;
  buttonColor?: string;
}

const hasTelegramObject = (): boolean => Boolean(window.Telegram?.WebApp);

export const isTelegramMiniAppRuntime = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  if (import.meta.env.VITE_FORCE_TELEGRAM_MODE === 'true') {
    return true;
  }
  return hasTelegramObject();
};

export const isTelegramWebApp = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (import.meta.env.VITE_FORCE_TELEGRAM_MODE === 'true') {
    return true;
  }

  if (isTelegramMiniAppRuntime()) {
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  return params.has('tgWebAppData') || params.has('tgWebAppStartParam');
};

export const getTelegramWebApp = (): TelegramWebApp | undefined => {
  return window.Telegram?.WebApp;
};

export const isLocalDevHost = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return true;
  }

  // Allow local LAN testing from phones/tablets on private networks.
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) {
    return true;
  }
  if (/^192\.168\.\d+\.\d+$/.test(host)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) {
    return true;
  }

  return false;
};

export const shouldBypassTelegramAuthForLocalDev = (): boolean => {
  if (!import.meta.env.DEV && !isLocalDevHost()) {
    return false;
  }

  const explicitBypassFlag = import.meta.env.VITE_TELEGRAM_AUTH_BYPASS_LOCAL;
  if (explicitBypassFlag === 'false') {
    return false;
  }

  return !getTelegramWebApp();
};

export const getTelegramInitData = (): string => {
  const webApp = getTelegramWebApp();
  if (webApp?.initData && webApp.initData.includes('hash=')) {
    return webApp.initData;
  }

  const extractFromUrl = (): string => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash);
    return searchParams.get('tgWebAppData') ?? hashParams.get('tgWebAppData') ?? '';
  };

  const rawFallback = extractFromUrl();
  if (!rawFallback) {
    return '';
  }

  const decodedFallback = rawFallback.includes('%') ? decodeURIComponent(rawFallback) : rawFallback;
  return decodedFallback.includes('hash=') ? decodedFallback : '';
};

export const applyTelegramThemeToRoot = (
  theme?: TelegramThemeParams,
  colorScheme?: 'light' | 'dark',
): void => {
  if (!theme) {
    if (colorScheme) {
      document.documentElement.setAttribute('data-tg-color-scheme', colorScheme);
    }
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
  if (colorScheme) {
    root.setAttribute('data-tg-color-scheme', colorScheme);
  }

  window.dispatchEvent(
    new CustomEvent<TelegramThemeSnapshot>('lila:telegram-theme-changed', {
      detail: {
        colorScheme,
        bgColor: theme?.bg_color,
        secondaryBgColor: theme?.secondary_bg_color,
        textColor: theme?.text_color,
        hintColor: theme?.hint_color,
        buttonColor: theme?.button_color,
      },
    }),
  );
};
