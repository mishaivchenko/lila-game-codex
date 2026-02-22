import { z } from 'zod';

export const eventSchema = z.object({
  eventType: z.enum(['game_started', 'move_performed', 'insight_saved', 'game_finished']),
  sessionId: z.string().uuid().optional(),
  timestamp: z.iso.datetime(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type EventEntity = z.infer<typeof eventSchema>;
