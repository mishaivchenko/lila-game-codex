import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../lib/authMiddleware.js';
import {
  createHostRoom,
  getRoomByCode,
  getRoomById,
  joinRoom,
  setRoomStatus,
  startRoom,
} from '../store/roomsStore.js';

const createRoomSchema = z.object({
  boardType: z.enum(['short', 'full']).default('full'),
});

const joinRoomSchema = z.object({
  roomCode: z.string().min(4).optional(),
});

export const roomsRouter = Router();

roomsRouter.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const parsed = createRoomSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid payload' });
  }

  try {
    const snapshot = createHostRoom({
      hostUserId: req.authUser.id,
      hostDisplayName: req.authUser.displayName,
      boardType: parsed.data.boardType,
    });
    return res.status(201).json({
      ok: true,
      ...snapshot,
      joinUrl: `/host-room/${snapshot.room.id}`,
    });
  } catch {
    return res.status(500).json({ ok: false, error: 'Failed to create room' });
  }
});

roomsRouter.get('/:roomId', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const snapshot = getRoomById(roomId);
  if (!snapshot) {
    return res.status(404).json({ ok: false, error: 'Room not found' });
  }
  return res.status(200).json({ ok: true, ...snapshot });
});

roomsRouter.get('/code/:code', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const snapshot = getRoomByCode(code);
  if (!snapshot) {
    return res.status(404).json({ ok: false, error: 'Room not found' });
  }
  return res.status(200).json({ ok: true, ...snapshot });
});

roomsRouter.post('/:roomId/join', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const parsed = joinRoomSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid payload' });
  }
  try {
    const resolvedRoomId = roomId === 'by-code' && parsed.data.roomCode
      ? getRoomByCode(parsed.data.roomCode)?.room.id
      : roomId;
    if (!resolvedRoomId) {
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
    const snapshot = joinRoom({
      roomId: resolvedRoomId,
      userId: req.authUser.id,
      displayName: req.authUser.displayName,
    });
    return res.status(200).json({ ok: true, ...snapshot });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'ROOM_FULL') {
      return res.status(409).json({ ok: false, error: 'Room is full' });
    }
    if (code === 'ROOM_FINISHED') {
      return res.status(409).json({ ok: false, error: 'Room is finished' });
    }
    return res.status(404).json({ ok: false, error: 'Room not found' });
  }
});

roomsRouter.post('/:roomId/start', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  try {
    const snapshot = startRoom(roomId, req.authUser.id);
    return res.status(200).json({ ok: true, ...snapshot });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'FORBIDDEN') {
      return res.status(403).json({ ok: false, error: 'Only host can start the game' });
    }
    return res.status(404).json({ ok: false, error: 'Room not found' });
  }
});

roomsRouter.post('/:roomId/finish', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  try {
    const snapshot = setRoomStatus(roomId, req.authUser.id, 'finished');
    return res.status(200).json({ ok: true, ...snapshot });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'FORBIDDEN') {
      return res.status(403).json({ ok: false, error: 'Only host can finish the game' });
    }
    return res.status(404).json({ ok: false, error: 'Room not found' });
  }
});
