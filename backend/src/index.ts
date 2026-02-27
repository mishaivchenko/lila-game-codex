import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventsRouter } from './routes/events.js';
import { authRouter } from './routes/auth.js';
import { roomsRouter } from './routes/rooms.js';
import { gamesRouter } from './routes/games.js';
import { ensureDbReady, getDbHealthStatus } from './lib/db.js';
import { requireAuth, type AuthenticatedRequest } from './lib/authMiddleware.js';
import { attachHostRoomSocket } from './socket/hostRoomSocket.js';

export const createApp = (): express.Express => {
  const app = express();
  app.use(
    cors({
      origin: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    void (async () => {
      const db = await getDbHealthStatus();
      const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);
      const healthOk = db.ok && telegramConfigured;
      res.status(healthOk ? 200 : 503).json({
        ok: healthOk,
        service: 'lila-backend',
        db,
        telegram: {
          configured: telegramConfigured,
        },
      });
    })();
  });

  app.use('/api/events', eventsRouter);
  app.use('/api/auth', authRouter);
  app.get('/api/me', requireAuth, (req: AuthenticatedRequest, res) => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    return res.status(200).json({ ok: true, user: req.authUser });
  });
  app.use('/api/rooms', roomsRouter);
  app.use('/api/games', gamesRouter);

  if (process.env.NODE_ENV === 'production') {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const frontendDist = process.env.FRONTEND_DIST ?? path.resolve(__dirname, '../../frontend/dist');
    const cardsDir = process.env.CARDS_DIR ?? path.resolve(__dirname, '../../cards');
    const fieldDir = process.env.FIELD_DIR ?? path.resolve(__dirname, '../../field');

    app.use(express.static(frontendDist, { index: false }));
    app.use('/cards', express.static(cardsDir));
    app.use('/field', express.static(fieldDir));

    app.get(/^(?!\/api|\/health).*/, (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  return app;
};

if (process.env.NODE_ENV !== 'test') {
  void (async () => {
    try {
      await ensureDbReady();
    } catch (error) {
      console.error(
        JSON.stringify({
          scope: 'startup',
          message: 'Database initialization failed. Starting API in degraded mode.',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }

    const app = createApp();
    const port = Number(process.env.PORT ?? 3001);
    const server = createServer(app);
    attachHostRoomSocket(server);
    server.listen(port, () => {
      console.log(`Lila events API listening on port ${port}`);
    });
  })();
}
