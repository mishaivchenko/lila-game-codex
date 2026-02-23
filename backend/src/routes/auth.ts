import { Router } from 'express';
import { z } from 'zod';
import { verifyTelegramWebAppInitData } from '../lib/telegramWebAppAuth.js';
import { upsertUserFromTelegram } from '../store/usersStore.js';
import { createAppToken } from '../lib/appToken.js';

const telegramWebAppSchema = z.object({
  initData: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/telegram/webapp', (req, res) => {
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
      user: {
        id: user.id,
        telegramId: user.telegramId,
        displayName: user.displayName,
        username: user.username,
        locale: user.locale,
      },
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
});
