import { apiFetch } from '../../../lib/api/apiClient';

export interface TelegramAppUser {
  id: string;
  telegramId: string;
  displayName: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  createdAt?: string;
  lastActiveAt?: string;
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

export const fetchCurrentUser = async (authToken: string): Promise<TelegramAppUser> => {
  const response = await apiFetch('/api/auth/me', { method: 'GET' }, authToken);
  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }
  const payload = await response.json() as { ok: boolean; user: TelegramAppUser };
  return payload.user;
};
