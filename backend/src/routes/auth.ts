import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { verifyTelegramWebAppInitData } from '../lib/telegramWebAppAuth.js';
import { upsertUserFromTelegram } from '../store/usersStore.js';
import { createAppToken } from '../lib/appToken.js';
import { requireAuth, type AuthenticatedRequest } from '../lib/authMiddleware.js';

const telegramWebAppSchema = z.object({
  initData: z.string().min(1),
});

export const authRouter = Router();

const serializeUser = (user: {
  id: string;
  telegramId: string;
  displayName: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  createdAt: string;
  lastActiveAt: string;
}) => ({
  id: user.id,
  telegramId: user.telegramId,
  displayName: user.displayName,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  locale: user.locale,
  createdAt: user.createdAt,
  lastActiveAt: user.lastActiveAt,
});

const handleTelegramAuth = (req: Request, res: Response) => {
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
    const user = upsertUserFromTelegram(telegramProfile);
    const token = createAppToken(user.id);

    return res.status(200).json({
      ok: true,
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.warn(
      JSON.stringify({
        scope: 'telegram_auth',
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
    return res.status(401).json({ ok: false, error: 'Telegram auth validation failed' });
  }
};

authRouter.post('/telegram/webapp', handleTelegramAuth);
authRouter.post('/telegram', handleTelegramAuth);

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  return res.status(200).json({
    ok: true,
    user: serializeUser(req.authUser),
  });
});
