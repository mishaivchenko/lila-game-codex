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
  locale?: string;
}

export interface AppUser {
  id: string;
  telegramId: string;
  displayName: string;
  username?: string;
  locale?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}
