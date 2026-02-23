import { apiFetch } from '../../../lib/api/apiClient';

export interface TelegramAppUser {
  id: string;
  telegramId: string;
  displayName: string;
  username?: string;
  locale?: string;
}

export interface TelegramAuthResponse {
  ok: boolean;
  token: string;
  user: TelegramAppUser;
}

export const authenticateTelegramWebApp = async (initData: string): Promise<TelegramAuthResponse> => {
  const response = await apiFetch('/api/auth/telegram/webapp', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    throw new Error('Telegram auth failed');
  }

  return response.json() as Promise<TelegramAuthResponse>;
};
