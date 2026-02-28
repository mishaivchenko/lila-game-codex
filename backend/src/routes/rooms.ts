import { createHash } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../lib/authMiddleware.js';
import { hasAdminBindingForChat } from '../store/usersStore.js';
import {
  closeRoomCard,
  createHostRoom,
  getRoomByCode,
  getRoomById,
  joinRoom,
  listRoomsForUser,
  recordRoomNote,
  setRoomStatus,
  startRoom,
  updateRoomPlayerTokenColor,
  updateRoomSettings,
  rollDiceForCurrentPlayer,
} from '../store/roomsStore.js';
import { upsertGameSessionForUser } from '../store/gamesStore.js';

const createRoomSchema = z.object({
  boardType: z.enum(['short', 'full']).default('full'),
});

const joinRoomSchema = z.object({
  roomCode: z.string().min(4).optional(),
});
const roomNoteSchema = z.object({
  cellNumber: z.number().int().min(1),
  note: z.string().max(4000),
  scope: z.enum(['host', 'player', 'host_player']),
  targetPlayerId: z.string().uuid().optional(),
});
const roomSettingsSchema = z.object({
  diceMode: z.enum(['classic', 'fast', 'triple']).optional(),
  allowHostCloseAnyCard: z.boolean().optional(),
  hostCanPause: z.boolean().optional(),
});
const roomPlayerPreferencesSchema = z.object({
  tokenColor: z.string().min(1).max(32),
});

const resolveParticipantLabel = (user: NonNullable<AuthenticatedRequest['authUser']>): string =>
  user.username ? `@${user.username}` : user.displayName;

const stableUuidFromRoomAndUser = (roomId: string, userId: string): string => {
  const hex = createHash('sha1').update(`${roomId}:${userId}`).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  const variant = Number.parseInt(hex[16], 16);
  hex[16] = ((variant & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20, 32).join('')}`;
};

const canHostInScope = async (req: AuthenticatedRequest): Promise<boolean> => {
  if (!req.authUser) {
    return false;
  }
  if (req.authUser.isSuperAdmin) {
    return true;
  }
  if (req.authUser.isAdmin && req.authScope?.chatType === 'private') {
    return true;
  }
  return hasAdminBindingForChat(req.authUser.id, req.authScope?.chatInstance);
};

export const roomsRouter = Router();

roomsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const snapshots = await listRoomsForUser(req.authUser.id, 12);
    return res.status(200).json({ ok: true, rooms: snapshots });
  })();
});

roomsRouter.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const canHostCurrentChat = await canHostInScope(req);
    if (!canHostCurrentChat) {
      return res.status(403).json({ ok: false, error: 'Admin access for this Telegram chat is required to host room' });
    }
    const parsed = createRoomSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }

    try {
      const snapshot = await createHostRoom({
        hostUserId: req.authUser.id,
        hostDisplayName: resolveParticipantLabel(req.authUser),
        boardType: parsed.data.boardType,
      });
      return res.status(201).json({ ok: true, ...snapshot, joinUrl: `/host-room/${snapshot.room.id}` });
    } catch (error) {
      console.error(
        JSON.stringify({
          scope: 'create_room',
          message: error instanceof Error ? error.message : String(error),
          userId: req.authUser?.id,
        }),
      );
      return res.status(500).json({ ok: false, error: 'Failed to create room' });
    }
  })();
});

roomsRouter.get('/code/:code', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const snapshot = await getRoomByCode(code);
    if (!snapshot) {
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
    return res.status(200).json({ ok: true, ...snapshot });
  })();
});

roomsRouter.get('/:roomId', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const snapshot = await getRoomById(roomId);
    if (!snapshot) {
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
    return res.status(200).json({ ok: true, ...snapshot });
  })();
});

roomsRouter.post('/by-code/join', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const parsed = joinRoomSchema.safeParse(req.body ?? {});
    if (!parsed.success || !parsed.data.roomCode) {
      return res.status(400).json({ ok: false, error: 'Room code is required' });
    }
    try {
      const byCode = await getRoomByCode(parsed.data.roomCode);
      if (!byCode) {
        return res.status(404).json({ ok: false, error: 'Room not found' });
      }
      const snapshot = await joinRoom({
        roomId: byCode.room.id,
        userId: req.authUser.id,
        displayName: resolveParticipantLabel(req.authUser),
      });
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      console.error(
        JSON.stringify({
          scope: 'join_room_by_code',
          roomCode: parsed.data.roomCode,
          userId: req.authUser?.id,
          code,
        }),
      );
      if (code === 'ROOM_FULL') {
        return res.status(409).json({ ok: false, error: 'Room is full' });
      }
      if (code === 'ROOM_FINISHED') {
        return res.status(409).json({ ok: false, error: 'Room is finished' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.post('/:roomId/join', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
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
        ? (await getRoomByCode(parsed.data.roomCode))?.room.id
        : roomId;
      if (!resolvedRoomId) {
        return res.status(404).json({ ok: false, error: 'Room not found' });
      }
      const snapshot = await joinRoom({
        roomId: resolvedRoomId,
        userId: req.authUser.id,
        displayName: resolveParticipantLabel(req.authUser),
      });
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      console.error(
        JSON.stringify({
          scope: 'join_room_by_code',
          roomCode: parsed.data.roomCode,
          userId: req.authUser?.id,
          code,
        }),
      );
      if (code === 'ROOM_FULL') {
        return res.status(409).json({ ok: false, error: 'Room is full' });
      }
      if (code === 'ROOM_FINISHED') {
        return res.status(409).json({ ok: false, error: 'Room is finished' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.post('/:roomId/card/close', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const snapshot = await closeRoomCard({ roomId, userId: req.authUser.id });
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN') {
        return res.status(403).json({ ok: false, error: 'You cannot close this card' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.post('/:roomId/notes', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const parsed = roomNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const snapshot = await recordRoomNote({
        roomId,
        userId: req.authUser.id,
        cellNumber: parsed.data.cellNumber,
        note: parsed.data.note,
        scope: parsed.data.scope,
        targetPlayerId: parsed.data.targetPlayerId,
      });
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN') {
        return res.status(403).json({ ok: false, error: 'Only host can save host notes' });
      }
      if (code === 'TARGET_PLAYER_REQUIRED') {
        return res.status(400).json({ ok: false, error: 'Host player note requires targetPlayerId' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.patch('/:roomId/settings', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const parsed = roomSettingsSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const snapshot = await updateRoomSettings({
        roomId,
        hostUserId: req.authUser.id,
        patch: parsed.data,
      });
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN') {
        return res.status(403).json({ ok: false, error: 'Only host can update room settings' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.patch('/:roomId/preferences', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const parsed = roomPlayerPreferencesSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const snapshot = await updateRoomPlayerTokenColor({
        roomId,
        userId: req.authUser.id,
        tokenColor: parsed.data.tokenColor,
      });
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'INVALID_TOKEN_COLOR') {
        return res.status(400).json({ ok: false, error: 'Invalid token color' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.post('/:roomId/start', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const snapshot = await startRoom(roomId, req.authUser.id);
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN') {
        return res.status(403).json({ ok: false, error: 'Only host can start the game' });
      }
      if (code === 'NO_PLAYERS') {
        return res.status(409).json({ ok: false, error: 'Add at least one player before starting the room' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.post('/:roomId/roll', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const result = await rollDiceForCurrentPlayer({
        roomId,
        userId: req.authUser.id,
      });
      return res.status(200).json({ ok: true, ...result.snapshot, move: result.move });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'HOST_CANNOT_ROLL') {
        return res.status(403).json({ ok: false, error: 'Host cannot roll dice' });
      }
      if (code === 'NOT_YOUR_TURN') {
        return res.status(409).json({ ok: false, error: 'It is not your turn' });
      }
      if (code === 'ROOM_NOT_IN_PROGRESS') {
        return res.status(409).json({ ok: false, error: 'Room is not in progress' });
      }
      if (code === 'ACTIVE_CARD_PENDING') {
        return res.status(409).json({ ok: false, error: 'Close current card before the next roll' });
      }
      if (code === 'PLAYER_ALREADY_FINISHED') {
        return res.status(409).json({ ok: false, error: 'Player has already finished' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.post('/:roomId/pause', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const snapshot = await setRoomStatus(roomId, req.authUser.id, 'paused');
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN') {
        return res.status(403).json({ ok: false, error: 'Only host can pause the game' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.post('/:roomId/resume', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const snapshot = await setRoomStatus(roomId, req.authUser.id, 'in_progress');
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN') {
        return res.status(403).json({ ok: false, error: 'Only host can resume the game' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});

roomsRouter.post('/:roomId/finish', requireAuth, (req: AuthenticatedRequest, res) => {
  void (async () => {
    if (!req.authUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    try {
      const snapshot = await setRoomStatus(roomId, req.authUser.id, 'finished');
      const now = new Date().toISOString();
      await Promise.all(snapshot.players.map(async (player) => {
        const playerState = snapshot.gameState.perPlayerState[player.userId];
        return upsertGameSessionForUser(player.userId, {
          id: stableUuidFromRoomAndUser(snapshot.room.id, player.userId),
          boardType: snapshot.room.boardType,
          currentCell: playerState?.currentCell ?? 1,
          settings: { diceMode: 'classic', depth: 'standard' },
          request: { isDeepEntry: false, simpleRequest: `Host room ${snapshot.room.code}` },
          hasEnteredGame: true,
          sessionStatus: 'completed',
          finished: true,
          finishedAt: now,
          createdAt: snapshot.room.createdAt,
          updatedAt: now,
        });
      }));
      return res.status(200).json({ ok: true, ...snapshot });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      console.error(
        JSON.stringify({
          scope: 'finish_room',
          roomId,
          userId: req.authUser?.id,
          code,
        }),
      );
      if (code === 'FORBIDDEN') {
        return res.status(403).json({ ok: false, error: 'Only host can finish the game' });
      }
      return res.status(404).json({ ok: false, error: 'Room not found' });
    }
  })();
});
