import type { TelegramAppStatus, TelegramAuthStatus } from '../../features/telegram/auth/TelegramAuthContext';

export type StartBootPhase = 'BOOT_SPLASH' | 'BOOT_AUTH_LOADING' | 'BOOT_READY' | 'BOOT_OFFLINE';

export interface ResolveStartBootPhaseInput {
  introDone: boolean;
  isTelegramMode: boolean;
  authStatus: TelegramAuthStatus;
  appStatus: TelegramAppStatus;
}

export const resolveStartBootPhase = ({
  introDone,
  isTelegramMode,
  authStatus,
  appStatus,
}: ResolveStartBootPhaseInput): StartBootPhase => {
  if (!introDone) {
    return 'BOOT_SPLASH';
  }
  if (isTelegramMode && (authStatus === 'loading' || appStatus === 'booting')) {
    return 'BOOT_AUTH_LOADING';
  }
  if (isTelegramMode && (appStatus === 'offline' || appStatus === 'networkError')) {
    return 'BOOT_OFFLINE';
  }
  return 'BOOT_READY';
};

export const startBootLabelByPhase: Record<StartBootPhase, string> = {
  BOOT_SPLASH: 'Soulvio Lila',
  BOOT_AUTH_LOADING: 'Синхронізуємо подорож…',
  BOOT_READY: 'Готово',
  BOOT_OFFLINE: 'Offline режим',
};

