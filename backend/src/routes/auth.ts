import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { verifyTelegramWebAppInitData } from '../lib/telegramWebAppAuth.js';
import {
  grantAdminChatBinding,
  hasAdminBindingForChat,
  upgradeUserToAdmin,
  upsertUserFromTelegram,
} from '../store/usersStore.js';
import { createAppToken } from '../lib/appToken.js';
import { requireAuth, type AuthenticatedRequest } from '../lib/authMiddleware.js';

const telegramWebAppSchema = z.object({
  initData: z.string().min(1),
});
const upgradeAdminSchema = z.object({
  starsPaid: z.number().int().nonnegative(),
});

export const authRouter = Router();

const isTelegramValidationError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return [
    'Missing initData or bot token',
    'Missing hash',
    'Invalid Telegram signature',
    'Expired initData',
    'Missing Telegram user',
    'Invalid Telegram user payload',
    'Missing Telegram user id',
  ].includes(error.message);
};

const serializeUser = (user: {
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
}, canHostCurrentChat = false) => ({
  id: user.id,
  telegramId: user.telegramId,
  displayName: user.displayName,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  locale: user.locale,
  role: user.role,
  isAdmin: user.isAdmin,
  isSuperAdmin: user.isSuperAdmin,
  canHostCurrentChat,
  createdAt: user.createdAt,
  lastActiveAt: user.lastActiveAt,
});

const canHostInScope = async ({
  isSuperAdmin,
  isAdmin,
  userId,
  chatInstance,
  chatType,
}: {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  userId: string;
  chatInstance?: string;
  chatType?: string;
}): Promise<boolean> => {
  if (isSuperAdmin) {
    return true;
  }
  if (isAdmin && chatType === 'private') {
    return true;
  }
  return hasAdminBindingForChat(userId, chatInstance);
};

const handleTelegramAuth = async (req: Request, res: Response) => {
  const parsed = telegramWebAppSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' });
  }

  try {
    const telegramProfile = verifyTelegramWebAppInitData(parsed.data.initData, botToken);
    const user = await upsertUserFromTelegram(telegramProfile);
    const canHostCurrentChat = await canHostInScope({
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      userId: user.id,
      chatInstance: telegramProfile.chatInstance,
      chatType: telegramProfile.chatType,
    });
    const token = createAppToken(user.id, 60 * 60 * 12, {
      chatInstance: telegramProfile.chatInstance,
      chatType: telegramProfile.chatType,
      startParam: telegramProfile.startParam,
    });

    return res.status(200).json({
      ok: true,
      token,
      user: serializeUser(user, canHostCurrentChat),
    });
  } catch (error) {
    console.warn(
      JSON.stringify({
        scope: 'telegram_auth',
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
    if (isTelegramValidationError(error)) {
      return res.status(401).json({ ok: false, error: 'Telegram auth validation failed' });
    }
    return res.status(500).json({ ok: false, error: 'Authentication backend is temporarily unavailable' });
  }
};

authRouter.post('/telegram/webapp', (req, res) => {
  void handleTelegramAuth(req, res);
});
authRouter.post('/telegram', (req, res) => {
  void handleTelegramAuth(req, res);
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const canHostCurrentChat = await canHostInScope({
      isSuperAdmin: req.authUser.isSuperAdmin,
      isAdmin: req.authUser.isAdmin,
      userId: req.authUser.id,
      chatInstance: req.authScope?.chatInstance,
      chatType: req.authScope?.chatType,
    });
    return res.status(200).json({
      ok: true,
      user: serializeUser(req.authUser, canHostCurrentChat),
    });
  })();
});

authRouter.post('/upgrade-admin', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const parsed = upgradeAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() });
    }

    if (!req.authScope?.chatInstance) {
      return res.status(400).json({ ok: false, error: 'Telegram chat scope is required for admin upgrade' });
    }

    if (req.authUser.isAdmin) {
      await grantAdminChatBinding({
        userId: req.authUser.id,
        chatInstance: req.authScope.chatInstance,
        chatType: req.authScope.chatType,
      });
      return res.status(200).json({ ok: true, user: serializeUser(req.authUser, true) });
    }

    if (parsed.data.starsPaid < 100) {
      return res.status(402).json({ ok: false, error: 'Not enough stars', requiredStars: 100 });
    }

    const updated = await upgradeUserToAdmin(req.authUser.id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    await grantAdminChatBinding({
      userId: updated.id,
      chatInstance: req.authScope.chatInstance,
      chatType: req.authScope.chatType,
    });

    return res.status(200).json({ ok: true, user: serializeUser(updated, true) });
  })();
});
