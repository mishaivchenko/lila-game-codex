import { Router } from 'express';
import { createRoom, getRoomByCode } from '../store/roomsStore.js';
import { requireAuth, type AuthenticatedRequest } from '../lib/authMiddleware.js';

export const roomsRouter = Router();

roomsRouter.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const room = createRoom(req.authUser.id);
    return res.status(201).json({ ok: true, room });
  } catch {
    return res.status(500).json({ ok: false, error: 'Failed to create room' });
  }
});

roomsRouter.get('/:code', requireAuth, (req, res) => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const room = getRoomByCode(code);
  if (!room) {
    return res.status(404).json({ ok: false, error: 'Room not found' });
  }

  return res.status(200).json({
    ok: true,
    room: {
      id: room.id,
      code: room.code,
      ownerUserId: room.ownerUserId,
      createdAt: room.createdAt,
      status: room.status,
    },
  });
});
