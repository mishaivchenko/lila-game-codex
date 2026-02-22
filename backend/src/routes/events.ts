import { Router } from 'express';
import { eventSchema } from '../types/events.js';

export const eventsRouter = Router();

eventsRouter.post('/', (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ accepted: false, errors: parsed.error.flatten() });
  }

  const event = parsed.data;
  console.log(
    JSON.stringify({
      scope: 'lila_event',
      ...event,
    }),
  );

  return res.status(202).json({ accepted: true });
});
