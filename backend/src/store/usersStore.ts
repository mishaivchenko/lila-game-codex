import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { isPostgresEnabled, queryDb, withDbTransaction } from '../lib/db.js';
import type { AppUser, TelegramAuthResult } from '../types/auth.js';

const usersByTelegramId = new Map<string, AppUser>();
const usersById = new Map<string, AppUser>();
const adminBindingsByUserId = new Map<string, Set<string>>();

const SUPER_ADMIN_USERNAMES = new Set(['soulvio', 'writemebeforemidnight']);
const SUPER_ADMIN_TELEGRAM_IDS = new Set<string>(
  (process.env.SUPER_ADMIN_TELEGRAM_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

type RoleState = Pick<AppUser, 'role' | 'isAdmin' | 'isSuperAdmin'>;

interface UserRow {
  id: string;
  telegram_user_id: string;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  display_name?: string | null;
  role: AppUser['role'];
  is_admin: boolean;
  is_super_admin: boolean;
  created_at: string;
  last_active_at: string;
}

interface AdminChatBindingRow {
  user_id: string;
  chat_instance: string;
}

const mapUserRow = (row: UserRow): AppUser => ({
  id: row.id,
  telegramId: row.telegram_user_id,
  displayName: row.display_name?.trim() || [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.telegram_username || 'Telegram user',
  username: row.telegram_username ?? undefined,
  firstName: row.first_name ?? undefined,
  lastName: row.last_name ?? undefined,
  locale: row.language_code ?? undefined,
  role: row.role,
  isAdmin: row.is_admin,
  isSuperAdmin: row.is_super_admin,
  createdAt: row.created_at,
  lastActiveAt: row.last_active_at,
});

const resolveRole = (telegram: TelegramAuthResult, existing?: AppUser): RoleState => {
  const username = telegram.username?.toLowerCase();
  const isSuperAdmin =
    (username ? SUPER_ADMIN_USERNAMES.has(username) : false)
    || SUPER_ADMIN_TELEGRAM_IDS.has(telegram.telegramId)
    || existing?.isSuperAdmin === true;
  if (isSuperAdmin) {
    return { role: 'SUPER_ADMIN', isAdmin: true, isSuperAdmin: true };
  }
  if (existing?.isAdmin) {
    return { role: 'ADMIN', isAdmin: true, isSuperAdmin: false };
  }
  return { role: 'USER', isAdmin: false, isSuperAdmin: false };
};

const storeInMemory = (user: AppUser): AppUser => {
  usersById.set(user.id, user);
  usersByTelegramId.set(user.telegramId, user);
  return user;
};

const storeAdminBindingInMemory = (userId: string, chatInstance: string): void => {
  if (!chatInstance) {
    return;
  }
  const existing = adminBindingsByUserId.get(userId) ?? new Set<string>();
  existing.add(chatInstance);
  adminBindingsByUserId.set(userId, existing);
};

const upsertUserInMemory = (telegram: TelegramAuthResult): AppUser => {
  const now = new Date().toISOString();
  const existing = usersByTelegramId.get(telegram.telegramId);
  const roleState = resolveRole(telegram, existing);
  if (existing) {
    return storeInMemory({
      ...existing,
      displayName: telegram.displayName,
      username: telegram.username,
      firstName: telegram.firstName,
      lastName: telegram.lastName,
      locale: telegram.locale,
      ...roleState,
      lastActiveAt: now,
    });
  }

  return storeInMemory({
    id: randomUUID(),
    telegramId: telegram.telegramId,
    displayName: telegram.displayName,
    username: telegram.username,
    firstName: telegram.firstName,
    lastName: telegram.lastName,
    locale: telegram.locale,
    ...roleState,
    createdAt: now,
    lastActiveAt: now,
  });
};

const readUserByIdInMemory = async (id: string): Promise<AppUser | undefined> => usersById.get(id);

const upsertUserInDb = async (telegram: TelegramAuthResult): Promise<AppUser> => {
  return withDbTransaction(async (client: PoolClient) => {
    const existingRows = await client.query<UserRow>(
      `SELECT
        id,
        telegram_user_id,
        telegram_username,
        first_name,
        last_name,
        language_code,
        COALESCE(first_name || ' ' || last_name, first_name, telegram_username) AS display_name,
        role,
        is_admin,
        is_super_admin,
        created_at,
        last_active_at
      FROM users
      WHERE telegram_user_id = $1
      LIMIT 1`,
      [telegram.telegramId],
    );
    const existing = existingRows.rows[0] ? mapUserRow(existingRows.rows[0]) : undefined;
    const roleState = resolveRole(telegram, existing);
    const id = existing?.id ?? randomUUID();
    const rows = await client.query<UserRow>(
      `INSERT INTO users (
        id,
        telegram_user_id,
        telegram_username,
        first_name,
        last_name,
        language_code,
        role,
        is_admin,
        is_super_admin,
        created_at,
        last_active_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::timestamptz, NOW()), NOW())
      ON CONFLICT (telegram_user_id)
      DO UPDATE SET
        telegram_username = EXCLUDED.telegram_username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        language_code = EXCLUDED.language_code,
        role = EXCLUDED.role,
        is_admin = EXCLUDED.is_admin,
        is_super_admin = EXCLUDED.is_super_admin,
        last_active_at = NOW()
      RETURNING
        id,
        telegram_user_id,
        telegram_username,
        first_name,
        last_name,
        language_code,
        COALESCE(first_name || ' ' || last_name, first_name, telegram_username) AS display_name,
        role,
        is_admin,
        is_super_admin,
        created_at,
        last_active_at`,
      [
        id,
        telegram.telegramId,
        telegram.username ?? null,
        telegram.firstName ?? null,
        telegram.lastName ?? null,
        telegram.locale ?? null,
        roleState.role,
        roleState.isAdmin,
        roleState.isSuperAdmin,
        existing?.createdAt ?? null,
      ],
    );
    return mapUserRow(rows.rows[0]);
  });
};

export const upsertUserFromTelegram = async (telegram: TelegramAuthResult): Promise<AppUser> => {
  if (!isPostgresEnabled()) {
    return upsertUserInMemory(telegram);
  }
  const user = await upsertUserInDb(telegram);
  return storeInMemory(user);
};

export const getUserById = async (id: string): Promise<AppUser | undefined> => {
  if (!isPostgresEnabled()) {
    return readUserByIdInMemory(id);
  }
  const rows = await queryDb<UserRow>(
    `SELECT
      id,
      telegram_user_id,
      telegram_username,
      first_name,
      last_name,
      language_code,
      COALESCE(first_name || ' ' || last_name, first_name, telegram_username) AS display_name,
      role,
      is_admin,
      is_super_admin,
      created_at,
      last_active_at
    FROM users
    WHERE id = $1
    LIMIT 1`,
    [id],
  );
  const user = rows[0] ? mapUserRow(rows[0]) : undefined;
  if (user) {
    storeInMemory(user);
  }
  return user;
};

export const hasAdminBindingForChat = async (userId: string, chatInstance?: string): Promise<boolean> => {
  if (!chatInstance) {
    return false;
  }
  if (!isPostgresEnabled()) {
    return adminBindingsByUserId.get(userId)?.has(chatInstance) ?? false;
  }
  const rows = await queryDb<AdminChatBindingRow>(
    `SELECT user_id, chat_instance
     FROM admin_chat_bindings
     WHERE user_id = $1 AND chat_instance = $2
     LIMIT 1`,
    [userId, chatInstance],
  );
  if (rows[0]) {
    storeAdminBindingInMemory(userId, chatInstance);
    return true;
  }
  return false;
};

export const grantAdminChatBinding = async ({
  userId,
  chatInstance,
  chatType,
  grantedByUserId,
}: {
  userId: string;
  chatInstance: string;
  chatType?: string;
  grantedByUserId?: string;
}): Promise<void> => {
  if (!chatInstance) {
    throw new Error('MISSING_CHAT_INSTANCE');
  }
  if (!isPostgresEnabled()) {
    storeAdminBindingInMemory(userId, chatInstance);
    return;
  }
  await queryDb(
    `INSERT INTO admin_chat_bindings (id, user_id, chat_instance, chat_type, granted_by_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (user_id, chat_instance)
     DO UPDATE SET
       chat_type = COALESCE(EXCLUDED.chat_type, admin_chat_bindings.chat_type),
       granted_by_user_id = COALESCE(EXCLUDED.granted_by_user_id, admin_chat_bindings.granted_by_user_id),
       updated_at = NOW()`,
    [randomUUID(), userId, chatInstance, chatType ?? null, grantedByUserId ?? null],
  );
  storeAdminBindingInMemory(userId, chatInstance);
};

export const upgradeUserToAdmin = async (id: string): Promise<AppUser | undefined> => {
  if (!isPostgresEnabled()) {
    const user = usersById.get(id);
    if (!user) {
      return undefined;
    }
    if (user.isSuperAdmin) {
      return user;
    }
    return storeInMemory({
      ...user,
      role: 'ADMIN',
      isAdmin: true,
      isSuperAdmin: false,
      lastActiveAt: new Date().toISOString(),
    });
  }

  const rows = await queryDb<UserRow>(
    `UPDATE users
      SET role = CASE WHEN is_super_admin THEN 'SUPER_ADMIN' ELSE 'ADMIN' END,
          is_admin = TRUE,
          admin_granted_at = COALESCE(admin_granted_at, NOW()),
          last_active_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        telegram_user_id,
        telegram_username,
        first_name,
        last_name,
        language_code,
        COALESCE(first_name || ' ' || last_name, first_name, telegram_username) AS display_name,
        role,
        is_admin,
        is_super_admin,
        created_at,
        last_active_at`,
    [id],
  );
  const user = rows[0] ? mapUserRow(rows[0]) : undefined;
  if (user) {
    storeInMemory(user);
  }
  return user;
};

export const clearUsersStore = async (): Promise<void> => {
  usersByTelegramId.clear();
  usersById.clear();
  adminBindingsByUserId.clear();
  if (!isPostgresEnabled()) {
    return;
  }
  await queryDb('DELETE FROM admin_chat_bindings');
  await queryDb('DELETE FROM room_players');
  await queryDb('DELETE FROM room_game_states');
  await queryDb('DELETE FROM host_rooms');
  await queryDb('DELETE FROM game_sessions');
  await queryDb('DELETE FROM users');
};
