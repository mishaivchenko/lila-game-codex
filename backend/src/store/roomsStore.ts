import { randomUUID } from 'node:crypto';
import type {
  GameRoom,
  RoomBoardType,
  RoomPlayer,
  RoomPlayerState,
  RoomSnapshot,
  RoomStatus,
} from '../types/rooms.js';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
const MAX_ROOM_PLAYERS = 6;
const TOKEN_COLORS = ['#1f2937', '#c57b5d', '#2cbfaf', '#8b5cf6', '#ef4444', '#f59e0b'];

const SHORT_TRANSITIONS = {
  snakes: new Map<number, number>([
    [11, 3],
    [15, 8],
    [18, 5],
    [27, 13],
    [33, 20],
  ]),
  arrows: new Map<number, number>([
    [2, 9],
    [7, 14],
    [12, 19],
    [17, 26],
    [24, 32],
  ]),
  maxCell: 34,
} as const;

const FULL_TRANSITIONS = {
  snakes: new Map<number, number>([
    [17, 7],
    [54, 34],
    [62, 19],
    [64, 60],
    [87, 24],
    [93, 73],
    [95, 75],
    [98, 79],
  ]),
  arrows: new Map<number, number>([
    [4, 14],
    [9, 31],
    [20, 38],
    [28, 84],
    [40, 59],
    [51, 67],
    [63, 81],
    [71, 91],
  ]),
  maxCell: 100,
} as const;

const transitionsByBoard: Record<RoomBoardType, { snakes: Map<number, number>; arrows: Map<number, number>; maxCell: number }> = {
  short: SHORT_TRANSITIONS,
  full: FULL_TRANSITIONS,
};

const roomsById = new Map<string, GameRoom>();
const roomsByCode = new Map<string, string>();

const generateRoomCode = (): string => {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[randomIndex];
  }
  return code;
};

const getUniqueRoomCode = (): string => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateRoomCode();
    if (!roomsByCode.has(code)) {
      return code;
    }
  }
  throw new Error('Unable to allocate room code');
};

const toSnapshot = (room: GameRoom): RoomSnapshot => ({
  room: {
    id: room.id,
    code: room.code,
    hostUserId: room.hostUserId,
    boardType: room.boardType,
    status: room.status,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  },
  players: room.players,
  gameState: room.gameState,
});

const touchRoom = (room: GameRoom): void => {
  room.updatedAt = new Date().toISOString();
};

const resolveDisplayName = (fallbackUserId: string, displayName?: string): string => {
  if (displayName?.trim()) {
    return displayName.trim();
  }
  return `Player ${fallbackUserId.slice(0, 4).toUpperCase()}`;
};

const ensureRoom = (roomId: string): GameRoom => {
  const room = roomsById.get(roomId);
  if (!room) {
    throw new Error('ROOM_NOT_FOUND');
  }
  return room;
};

const ensurePlayerInRoom = (room: GameRoom, userId: string): RoomPlayer => {
  const player = room.players.find((entry) => entry.userId === userId);
  if (!player) {
    throw new Error('PLAYER_NOT_IN_ROOM');
  }
  return player;
};

const findNextTurnPlayerId = (room: GameRoom, currentPlayerId: string): string => {
  const currentIndex = room.players.findIndex((player) => player.userId === currentPlayerId);
  if (currentIndex < 0) {
    return room.players[0]?.userId ?? currentPlayerId;
  }
  const nextIndex = (currentIndex + 1) % room.players.length;
  return room.players[nextIndex]?.userId ?? currentPlayerId;
};

const nextMoveFromDice = (
  boardType: RoomBoardType,
  currentCell: number,
  dice: number,
): { fromCell: number; toCell: number; snakeOrArrow: 'snake' | 'arrow' | null } => {
  const config = transitionsByBoard[boardType];
  const fromCell = currentCell;
  const cappedCell = Math.min(config.maxCell, currentCell + dice);
  if (config.snakes.has(cappedCell)) {
    return { fromCell, toCell: config.snakes.get(cappedCell)!, snakeOrArrow: 'snake' };
  }
  if (config.arrows.has(cappedCell)) {
    return { fromCell, toCell: config.arrows.get(cappedCell)!, snakeOrArrow: 'arrow' };
  }
  return { fromCell, toCell: cappedCell, snakeOrArrow: null };
};

export const createHostRoom = ({
  hostUserId,
  hostDisplayName,
  boardType,
}: {
  hostUserId: string;
  hostDisplayName?: string;
  boardType: RoomBoardType;
}): RoomSnapshot => {
  const now = new Date().toISOString();
  const roomId = randomUUID();
  const roomCode = getUniqueRoomCode();
  const hostPlayer: RoomPlayer = {
    id: randomUUID(),
    roomId,
    userId: hostUserId,
    displayName: resolveDisplayName(hostUserId, hostDisplayName),
    role: 'host',
    tokenColor: TOKEN_COLORS[0],
    joinedAt: now,
    connectionStatus: 'online',
  };
  const hostState: RoomPlayerState = {
    userId: hostUserId,
    currentCell: 1,
    status: 'in_progress',
    notesCount: 0,
  };
  const room: GameRoom = {
    id: roomId,
    code: roomCode,
    hostUserId,
    boardType,
    createdAt: now,
    updatedAt: now,
    status: 'open',
    players: [hostPlayer],
    gameState: {
      roomId,
      currentTurnPlayerId: hostUserId,
      perPlayerState: {
        [hostUserId]: hostState,
      },
      moveHistory: [],
    },
  };
  roomsById.set(roomId, room);
  roomsByCode.set(roomCode, roomId);
  return toSnapshot(room);
};

export const getRoomById = (roomId: string): RoomSnapshot | undefined => {
  const room = roomsById.get(roomId);
  return room ? toSnapshot(room) : undefined;
};

export const getRoomByCode = (code: string): RoomSnapshot | undefined => {
  const roomId = roomsByCode.get(code.trim().toUpperCase());
  if (!roomId) {
    return undefined;
  }
  const room = roomsById.get(roomId);
  return room ? toSnapshot(room) : undefined;
};

export const joinRoom = ({
  roomId,
  userId,
  displayName,
}: {
  roomId: string;
  userId: string;
  displayName?: string;
}): RoomSnapshot => {
  const room = ensureRoom(roomId);
  const existing = room.players.find((player) => player.userId === userId);
  if (existing) {
    existing.connectionStatus = 'online';
    touchRoom(room);
    return toSnapshot(room);
  }
  if (room.players.length >= MAX_ROOM_PLAYERS) {
    throw new Error('ROOM_FULL');
  }
  if (room.status === 'finished') {
    throw new Error('ROOM_FINISHED');
  }
  const now = new Date().toISOString();
  const player: RoomPlayer = {
    id: randomUUID(),
    roomId,
    userId,
    displayName: resolveDisplayName(userId, displayName),
    role: 'player',
    tokenColor: TOKEN_COLORS[room.players.length % TOKEN_COLORS.length],
    joinedAt: now,
    connectionStatus: 'online',
  };
  room.players.push(player);
  room.gameState.perPlayerState[userId] = {
    userId,
    currentCell: 1,
    status: 'in_progress',
    notesCount: 0,
  };
  if (!room.gameState.currentTurnPlayerId) {
    room.gameState.currentTurnPlayerId = userId;
  }
  touchRoom(room);
  return toSnapshot(room);
};

export const setRoomConnectionState = (roomId: string, userId: string, status: 'online' | 'offline'): RoomSnapshot => {
  const room = ensureRoom(roomId);
  const player = ensurePlayerInRoom(room, userId);
  player.connectionStatus = status;
  touchRoom(room);
  return toSnapshot(room);
};

export const startRoom = (roomId: string, hostUserId: string): RoomSnapshot => {
  const room = ensureRoom(roomId);
  if (room.hostUserId !== hostUserId) {
    throw new Error('FORBIDDEN');
  }
  room.status = 'in_progress';
  if (!room.gameState.currentTurnPlayerId && room.players[0]) {
    room.gameState.currentTurnPlayerId = room.players[0].userId;
  }
  touchRoom(room);
  return toSnapshot(room);
};

export const setRoomStatus = (roomId: string, hostUserId: string, status: RoomStatus): RoomSnapshot => {
  const room = ensureRoom(roomId);
  if (room.hostUserId !== hostUserId) {
    throw new Error('FORBIDDEN');
  }
  room.status = status;
  touchRoom(room);
  return toSnapshot(room);
};

export const recordRoomNote = ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}): RoomSnapshot => {
  const room = ensureRoom(roomId);
  ensurePlayerInRoom(room, userId);
  const playerState = room.gameState.perPlayerState[userId];
  if (playerState) {
    playerState.notesCount += 1;
  }
  touchRoom(room);
  return toSnapshot(room);
};

export const rollDiceForCurrentPlayer = ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}): {
  snapshot: RoomSnapshot;
  move: {
    userId: string;
    fromCell: number;
    toCell: number;
    dice: number;
    snakeOrArrow: 'snake' | 'arrow' | null;
    nextTurnPlayerId: string;
  };
} => {
  const room = ensureRoom(roomId);
  if (room.status !== 'in_progress') {
    throw new Error('ROOM_NOT_IN_PROGRESS');
  }
  if (room.gameState.currentTurnPlayerId !== userId) {
    throw new Error('NOT_YOUR_TURN');
  }
  ensurePlayerInRoom(room, userId);
  const playerState = room.gameState.perPlayerState[userId];
  if (!playerState || playerState.status === 'finished') {
    throw new Error('PLAYER_ALREADY_FINISHED');
  }

  const dice = Math.floor(Math.random() * 6) + 1;
  const { fromCell, toCell, snakeOrArrow } = nextMoveFromDice(room.boardType, playerState.currentCell, dice);
  playerState.currentCell = toCell;
  if (toCell >= transitionsByBoard[room.boardType].maxCell) {
    playerState.status = 'finished';
  }

  const nextTurnPlayerId = findNextTurnPlayerId(room, userId);
  room.gameState.currentTurnPlayerId = nextTurnPlayerId;
  room.gameState.moveHistory.push({
    userId,
    fromCell,
    toCell,
    dice,
    snakeOrArrow,
    timestamp: new Date().toISOString(),
  });
  touchRoom(room);
  return {
    snapshot: toSnapshot(room),
    move: {
      userId,
      fromCell,
      toCell,
      dice,
      snakeOrArrow,
      nextTurnPlayerId,
    },
  };
};

export const clearRoomsStore = (): void => {
  roomsById.clear();
  roomsByCode.clear();
};
