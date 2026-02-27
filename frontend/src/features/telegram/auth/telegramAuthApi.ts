import { apiFetch } from '../../../lib/api/apiClient';

export interface TelegramAppUser {
  id: string;
  telegramId: string;
  displayName: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  canHostCurrentChat?: boolean;
  createdAt?: string;
  lastActiveAt?: string;
}

export interface TelegramAuthResponse {
  ok: boolean;
  token: string;
  user: TelegramAppUser;
}

const parseAuthError = async (response: Response): Promise<string> => {
  const textPayload = await response.text().catch(() => '');
  if (textPayload.trim()) {
    try {
      const jsonPayload = JSON.parse(textPayload) as { error?: string };
      if (jsonPayload.error) {
        return jsonPayload.error;
      }
    } catch {
      return textPayload.trim();
    }
  }
  return `Telegram auth failed (${response.status})`;
};

export const authenticateTelegramWebApp = async (initData: string): Promise<TelegramAuthResponse> => {
  const candidateRoutes = ['/api/auth/telegram/webapp', '/api/auth/telegram'];
  const errors: string[] = [];

  for (const route of candidateRoutes) {
    const response = await apiFetch(route, {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
    if (response.ok) {
      return response.json() as Promise<TelegramAuthResponse>;
    }

    const errorMessage = await parseAuthError(response);
    errors.push(`${route}: ${errorMessage}`);

    // If backend reached auth route and returned validation/auth error,
    // do not hide it behind fallback noise.
    if (response.status === 400 || response.status === 401) {
      break;
    }
  }

  throw new Error(errors[errors.length - 1] ?? 'Telegram auth failed');
};

export const fetchCurrentUser = async (authToken: string): Promise<TelegramAppUser> => {
  const response = await apiFetch('/api/auth/me', { method: 'GET' }, authToken);
  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }
  const payload = await response.json() as { ok: boolean; user: TelegramAppUser };
  return payload.user;
};

export const upgradeToAdmin = async (authToken: string, starsPaid: number): Promise<TelegramAppUser> => {
  const response = await apiFetch(
    '/api/auth/upgrade-admin',
    {
      method: 'POST',
      body: JSON.stringify({ starsPaid }),
    },
    authToken,
  );
  if (!response.ok) {
    throw new Error('Failed to upgrade admin access');
  }
  const payload = await response.json() as { ok: boolean; user: TelegramAppUser };
  return payload.user;
};
