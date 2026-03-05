import type { TelegramAppStatus, TelegramAuthStatus } from '../auth/TelegramAuthContext';

export type AppBootstrapState = 'initializing' | 'syncing' | 'ready' | 'offline' | 'authError' | 'networkError';

export const resolveAppBootstrapState = (
  authStatus: TelegramAuthStatus,
  appStatus: TelegramAppStatus,
  hasToken: boolean,
): AppBootstrapState => {
  if (authStatus === 'loading' || appStatus === 'booting') {
    return 'initializing';
  }
  if (authStatus === 'error' || appStatus === 'authError') {
    return 'authError';
  }
  if (appStatus === 'networkError') {
    return 'networkError';
  }
  if (authStatus === 'authenticated' && !hasToken) {
    return 'offline';
  }
  if (authStatus === 'authenticated' && appStatus === 'offline') {
    return 'offline';
  }
  if (authStatus === 'authenticated') {
    return 'syncing';
  }
  return 'ready';
};

export const bootstrapLabelByState: Record<AppBootstrapState, string> = {
  initializing: 'Ініціалізуємо Telegram Mini App...',
  syncing: 'Синхронізація з backend...',
  ready: 'Готово',
  offline: 'Offline режим: локальна гра доступна, online-кімнати тимчасово вимкнені.',
  authError: 'Помилка Telegram авторизації.',
  networkError: 'Проблема з мережею: online-режим тимчасово недоступний.',
};

