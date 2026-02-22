import cors from 'cors';
import express from 'express';
import { eventsRouter } from './routes/events.js';

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
  return app;
};

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => {
    console.log(`Lila events API listening on port ${port}`);
  });
}
