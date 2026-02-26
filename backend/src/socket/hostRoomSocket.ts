import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { verifyAppToken } from '../lib/appToken.js';
import { getUserById } from '../store/usersStore.js';
import { getRoomById, joinRoom, recordRoomNote, rollDiceForCurrentPlayer, setRoomConnectionState, setRoomStatus, startRoom } from '../store/roomsStore.js';

const namespaceName = '/host-room';

export const attachHostRoomSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  const namespace = io.of(namespaceName);

  namespace.use((socket, next) => {
    void (async () => {
      const token = typeof socket.handshake.auth?.token === 'string'
        ? socket.handshake.auth.token
        : typeof socket.handshake.headers.authorization === 'string'
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : undefined;
      if (!token) {
        next(new Error('Missing auth token'));
        return;
      }

      try {
        const payload = verifyAppToken(token);
        const user = await getUserById(payload.sub);
        if (!user) {
          next(new Error('User not found'));
          return;
        }
        socket.data.user = user;
        next();
      } catch {
        next(new Error('Invalid auth token'));
      }
    })();
  });

  namespace.on('connection', (socket) => {
    const authUser = socket.data.user as { id: string; displayName: string };

    socket.on('joinRoom', ({ roomId }: { roomId: string }) => {
      void (async () => {
        try {
          const snapshot = await joinRoom({ roomId, userId: authUser.id, displayName: authUser.displayName });
          await socket.join(`room:${roomId}`);
          namespace.to(`room:${roomId}`).emit('playerJoined', {
            playerId: authUser.id,
            displayName: authUser.displayName,
          });
          namespace.to(`room:${roomId}`).emit('roomStateUpdated', snapshot);
        } catch {
          socket.emit('roomError', { message: 'Unable to join room' });
        }
      })();
    });

    socket.on('rollDice', ({ roomId }: { roomId: string }) => {
      void (async () => {
        try {
          const result = await rollDiceForCurrentPlayer({ roomId, userId: authUser.id });
          namespace.to(`room:${roomId}`).emit('diceRolled', {
            playerId: result.move.userId,
            dice: result.move.dice,
          });
          namespace.to(`room:${roomId}`).emit('tokenMoved', {
            playerId: result.move.userId,
            fromCell: result.move.fromCell,
            toCell: result.move.toCell,
            snakeOrArrow: result.move.snakeOrArrow,
          });
          namespace.to(`room:${roomId}`).emit('roomStateUpdated', result.snapshot);
        } catch (error) {
          socket.emit('roomError', { message: error instanceof Error ? error.message : 'Failed to roll dice' });
        }
      })();
    });

    socket.on('updateNote', ({ roomId }: { roomId: string; cell: number; note: string }) => {
      void (async () => {
        try {
          const snapshot = await recordRoomNote({ roomId, userId: authUser.id });
          namespace.to(`room:${roomId}`).emit('roomStateUpdated', snapshot);
        } catch {
          socket.emit('roomError', { message: 'Failed to update note' });
        }
      })();
    });

    socket.on('hostCommand', ({ roomId, action }: { roomId: string; action: 'start' | 'pause' | 'resume' | 'finish' }) => {
      void (async () => {
        try {
          const room = await getRoomById(roomId);
          if (!room) {
            socket.emit('roomError', { message: 'Room not found' });
            return;
          }
          if (room.room.hostUserId !== authUser.id) {
            socket.emit('roomError', { message: 'Only host can execute this command' });
            return;
          }

          const snapshot =
            action === 'start'
              ? await startRoom(roomId, authUser.id)
              : action === 'pause'
                ? await setRoomStatus(roomId, authUser.id, 'paused')
                : action === 'resume'
                  ? await setRoomStatus(roomId, authUser.id, 'in_progress')
                  : await setRoomStatus(roomId, authUser.id, 'finished');
          namespace.to(`room:${roomId}`).emit('roomStateUpdated', snapshot);
        } catch {
          socket.emit('roomError', { message: 'Failed to execute host command' });
        }
      })();
    });

    socket.on('disconnecting', () => {
      void (async () => {
        for (const roomName of socket.rooms) {
          if (!roomName.startsWith('room:')) {
            continue;
          }
          const roomId = roomName.replace('room:', '');
          try {
            const snapshot = await setRoomConnectionState(roomId, authUser.id, 'offline');
            namespace.to(roomName).emit('roomStateUpdated', snapshot);
          } catch {
            // no-op
          }
        }
      })();
    });
  });

  return io;
};
