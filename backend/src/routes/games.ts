import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../lib/authMiddleware.js';
import {
  getUserGameSessionById,
  listUserGameSessions,
  patchGameSessionForUser,
  upsertGameSessionForUser,
} from '../store/gamesStore.js';

const boardTypeSchema = z.enum(['short', 'full']);
const depthSchema = z.enum(['light', 'standard', 'deep']);
const diceModeSchema = z.enum(['classic', 'fast', 'triple']);

const gameSessionPayloadSchema = z.object({
  id: z.string().min(1),
  boardType: boardTypeSchema,
  currentCell: z.number().int().min(1),
  settings: z.object({
    diceMode: diceModeSchema,
    depth: depthSchema,
  }),
  request: z.object({
    simpleRequest: z.string().optional(),
    need: z.string().optional(),
    question: z.string().optional(),
    isDeepEntry: z.boolean(),
    area: z.string().optional(),
    feelings: z.array(z.string()).optional(),
    outcome: z.string().optional(),
  }),
  hasEnteredGame: z.boolean(),
  sessionStatus: z.enum(['active', 'completed']),
  finished: z.boolean(),
  finishedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const upsertGameSchema = z.object({
  session: gameSessionPayloadSchema,
});

const patchGameSchema = z.object({
  session: gameSessionPayloadSchema.partial(),
});

export const gamesRouter = Router();

gamesRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const limitRaw = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(20, Math.max(1, Math.floor(limitRaw))) : 10;
  const sessions = listUserGameSessions(req.authUser.id, limit);
  return res.status(200).json({ ok: true, sessions });
});

gamesRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const session = getUserGameSessionById(req.authUser.id, sessionId);
  if (!session) {
    return res.status(404).json({ ok: false, error: 'Game session not found' });
  }
  return res.status(200).json({ ok: true, session });
});

gamesRouter.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const parsed = upsertGameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const session = upsertGameSessionForUser(req.authUser.id, parsed.data.session);
  return res.status(201).json({ ok: true, session });
});

gamesRouter.put('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const parsed = upsertGameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (sessionId !== parsed.data.session.id) {
    return res.status(400).json({ ok: false, error: 'Session id mismatch' });
  }
  const session = upsertGameSessionForUser(req.authUser.id, parsed.data.session);
  return res.status(200).json({ ok: true, session });
});

gamesRouter.patch('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const parsed = patchGameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const session = patchGameSessionForUser(req.authUser.id, sessionId, parsed.data.session);
  if (!session) {
    return res.status(404).json({ ok: false, error: 'Game session not found' });
  }
  return res.status(200).json({ ok: true, session });
});
