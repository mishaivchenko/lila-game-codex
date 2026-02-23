import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventsRouter } from './routes/events.js';
import { authRouter } from './routes/auth.js';
import { roomsRouter } from './routes/rooms.js';

export const createApp = (): express.Express => {
  const app = express();
  app.use(
    cors({
      origin: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/events', eventsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/rooms', roomsRouter);

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
  const app = createApp();
  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => {
    console.log(`Lila events API listening on port ${port}`);
  });
}
