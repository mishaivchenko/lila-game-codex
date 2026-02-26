import crypto from 'node:crypto';
import type { TelegramAuthResult, TelegramUserPayload } from '../types/auth.js';

const MAX_INIT_DATA_AGE_SECONDS = 60 * 60 * 6;

const parseInitData = (initData: string): Map<string, string> => {
  const params = new URLSearchParams(initData);
  const map = new Map<string, string>();
  params.forEach((value, key) => {
    map.set(key, value);
  });
  return map;
};

const buildDataCheckString = (entries: Map<string, string>): string => {
  const rows = Array.from(entries.entries())
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  return rows.join('\n');
};

const createHash = (botToken: string, dataCheckString: string): string => {
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  return crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
};

export const verifyTelegramWebAppInitData = (initData: string, botToken: string): TelegramAuthResult => {
  if (!initData || !botToken) {
    throw new Error('Missing initData or bot token');
  }

  const entries = parseInitData(initData);
  const hash = entries.get('hash');
  if (!hash) {
    throw new Error('Missing hash');
  }

  const dataCheckString = buildDataCheckString(entries);
  const expectedHash = createHash(botToken, dataCheckString);
  const hashBuffer = Buffer.from(hash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  if (
    hashBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(hashBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid Telegram signature');
  }

  const authDateRaw = entries.get('auth_date');
  const authDate = Number(authDateRaw ?? 0);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate <= 0 || now - authDate > MAX_INIT_DATA_AGE_SECONDS) {
    throw new Error('Expired initData');
  }

  const userRaw = entries.get('user');
  if (!userRaw) {
    throw new Error('Missing Telegram user');
  }

  let user: TelegramUserPayload;
  try {
    user = JSON.parse(userRaw) as TelegramUserPayload;
  } catch {
    throw new Error('Invalid Telegram user payload');
  }

  if (!user.id) {
    throw new Error('Missing Telegram user id');
  }

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.username ||
    `telegram-${user.id}`;

  return {
    telegramId: String(user.id),
    displayName,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    locale: user.language_code,
    chatInstance: entries.get('chat_instance') ?? undefined,
    chatType: entries.get('chat_type') ?? undefined,
    startParam: entries.get('start_param') ?? undefined,
  };
};
