import { randomUUID } from 'node:crypto';
import type { AppUser, TelegramAuthResult } from '../types/auth.js';

const usersByTelegramId = new Map<string, AppUser>();
const usersById = new Map<string, AppUser>();

export const upsertUserFromTelegram = (telegram: TelegramAuthResult): AppUser => {
  const now = new Date().toISOString();
  const existing = usersByTelegramId.get(telegram.telegramId);
  if (existing) {
    const updated: AppUser = {
      ...existing,
      displayName: telegram.displayName,
      username: telegram.username,
      firstName: telegram.firstName,
      lastName: telegram.lastName,
      locale: telegram.locale,
      lastActiveAt: now,
    };
    usersByTelegramId.set(telegram.telegramId, updated);
    usersById.set(updated.id, updated);
    return updated;
  }

  const created: AppUser = {
    id: randomUUID(),
    telegramId: telegram.telegramId,
    displayName: telegram.displayName,
    username: telegram.username,
    firstName: telegram.firstName,
    lastName: telegram.lastName,
    locale: telegram.locale,
    createdAt: now,
    lastActiveAt: now,
  };
  usersByTelegramId.set(telegram.telegramId, created);
  usersById.set(created.id, created);
  return created;
};

export const getUserById = (id: string): AppUser | undefined => usersById.get(id);

export const clearUsersStore = (): void => {
  usersByTelegramId.clear();
  usersById.clear();
};
