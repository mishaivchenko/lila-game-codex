export interface TelegramUserPayload {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramAuthResult {
  telegramId: string;
  displayName: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  chatInstance?: string;
  chatType?: string;
  startParam?: string;
}

export interface AuthScopeContext {
  chatInstance?: string;
  chatType?: string;
  startParam?: string;
}

export interface AppUser {
  id: string;
  telegramId: string;
  displayName: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  lastActiveAt: string;
}
