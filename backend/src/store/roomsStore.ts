import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { isPostgresEnabled, queryDb, withDbTransaction } from '../lib/db.js';
import type {
  GameRoom,
  RoomBoardType,
  RoomConnectionStatus,
  RoomDiceMode,
  RoomGameState,
  RoomPlayer,
  RoomPlayerState,
  RoomSnapshot,
  RoomStatus,
} from '../types/rooms.js';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
const MAX_ROOM_PLAYERS = 6;
const TOKEN_COLORS = ['#1f2937', '#c57b5d', '#2cbfaf', '#8b5cf6', '#ef4444', '#f59e0b'];
const EMOJI_FALLBACKS = ['🦊', '🦉', '🐬', '🦁', '🐙', '🦄', '🐢', '🪷'];

const SHORT_TRANSITIONS = {
  snakes: new Map<number, number>([[11, 3], [15, 8], [18, 5], [27, 13], [33, 20]]),
  arrows: new Map<number, number>([[2, 9], [7, 14], [12, 19], [17, 26], [24, 32]]),
  maxCell: 34,
} as const;

const FULL_TRANSITIONS = {
  snakes: new Map<number, number>([[17, 7], [54, 34], [62, 19], [64, 60], [87, 24], [93, 73], [95, 75], [98, 79]]),
  arrows: new Map<number, number>([[4, 14], [9, 31], [20, 38], [28, 84], [40, 59], [51, 67], [63, 81], [71, 91]]),
  maxCell: 100,
} as const;

const transitionsByBoard: Record<RoomBoardType, { snakes: Map<number, number>; arrows: Map<number, number>; maxCell: number }> = {
  short: SHORT_TRANSITIONS,
  full: FULL_TRANSITIONS,
};

const roomsById = new Map<string, GameRoom>();
const roomsByCode = new Map<string, string>();

interface HostRoomRow {
  id: string;
  room_code: string;
  host_user_id: string;
  board_type: RoomBoardType;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}

interface RoomPlayerRow {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  role: RoomPlayer['role'];
  token_color: string;
  joined_at: string;
  connection_status: RoomConnectionStatus;
}

interface RoomGameStateRow {
  room_id: string;
  current_turn_player_id: string;
  per_player_state_json: Record<string, RoomPlayerState>;
  move_history_json: RoomGameState['moveHistory'];
  active_card_json?: RoomGameState['activeCard'];
  notes_json?: RoomGameState['notes'];
  settings_json?: RoomGameState['settings'];
  updated_at: string;
}

type DbClient = Pick<PoolClient, 'query'>;

const generateRoomCode = (): string => {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[randomIndex];
  }
  return code;
};

const mapPlayerRow = (row: RoomPlayerRow): RoomPlayer => ({
  id: row.id,
  roomId: row.room_id,
  userId: row.user_id,
  displayName: row.display_name,
  role: row.role,
  tokenColor: row.token_color,
  joinedAt: row.joined_at,
  connectionStatus: row.connection_status,
});

const mapRoom = (roomRow: HostRoomRow, playerRows: RoomPlayerRow[], stateRow: RoomGameStateRow): GameRoom => ({
  id: roomRow.id,
  code: roomRow.room_code,
  hostUserId: roomRow.host_user_id,
  boardType: roomRow.board_type,
  createdAt: roomRow.created_at,
  updatedAt: roomRow.updated_at,
  status: roomRow.status,
  players: playerRows.map(mapPlayerRow),
  gameState: {
    roomId: stateRow.room_id,
    currentTurnPlayerId: stateRow.current_turn_player_id,
    perPlayerState: stateRow.per_player_state_json,
    moveHistory: stateRow.move_history_json,
    activeCard: stateRow.active_card_json ?? null,
    notes: stateRow.notes_json ?? {
      hostByCell: {},
      playerByUserId: {},
    },
    settings: stateRow.settings_json ?? {
      diceMode: 'classic',
      allowHostCloseAnyCard: true,
      hostCanPause: true,
    },
  },
});

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

const storeInMemory = (room: GameRoom): RoomSnapshot => {
  roomsById.set(room.id, room);
  roomsByCode.set(room.code, room.id);
  return toSnapshot(room);
};

const touchRoom = (room: GameRoom): void => {
  room.updatedAt = new Date().toISOString();
};

const resolveDisplayName = (fallbackUserId: string, displayName?: string): string => {
  if (displayName?.trim()) {
    return displayName.trim();
  }
  const emoji = EMOJI_FALLBACKS[fallbackUserId.length % EMOJI_FALLBACKS.length];
  return `${emoji} Player`;
};

const getInitialRoomSettings = (): RoomGameState['settings'] => ({
  diceMode: 'classic',
  allowHostCloseAnyCard: true,
  hostCanPause: true,
});

const rollDiceByMode = (mode: RoomDiceMode): { values: number[]; total: number } => {
  const count = mode === 'triple' ? 3 : mode === 'fast' ? 2 : 1;
  const values = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
  return {
    values,
    total: values.reduce((sum, value) => sum + value, 0),
  };
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

const queryRoomByIdDb = async (client: DbClient, roomId: string, forUpdate = false): Promise<GameRoom | undefined> => {
  const roomRows = await client.query<HostRoomRow>(
    `SELECT * FROM host_rooms WHERE id = $1 ${forUpdate ? 'FOR UPDATE' : ''}`,
    [roomId],
  );
  const roomRow = roomRows.rows[0];
  if (!roomRow) {
    return undefined;
  }
  const [playerRows, stateRows] = await Promise.all([
    client.query<RoomPlayerRow>('SELECT * FROM room_players WHERE room_id = $1 ORDER BY joined_at ASC', [roomId]),
    client.query<RoomGameStateRow>(
      `SELECT * FROM room_game_states WHERE room_id = $1 ${forUpdate ? 'FOR UPDATE' : ''}`,
      [roomId],
    ),
  ]);
  const stateRow = stateRows.rows[0];
  if (!stateRow) {
    throw new Error('ROOM_STATE_NOT_FOUND');
  }
  return mapRoom(roomRow, playerRows.rows, stateRow);
};

const queryRoomByCodeDb = async (client: DbClient, code: string): Promise<GameRoom | undefined> => {
  const roomRows = await client.query<HostRoomRow>('SELECT * FROM host_rooms WHERE room_code = $1 LIMIT 1', [code]);
  const roomRow = roomRows.rows[0];
  if (!roomRow) {
    return undefined;
  }
  return queryRoomByIdDb(client, roomRow.id);
};

const getDbRoomById = async (roomId: string): Promise<GameRoom | undefined> => {
  const roomRows = await queryDb<HostRoomRow>('SELECT * FROM host_rooms WHERE id = $1 LIMIT 1', [roomId]);
  const roomRow = roomRows[0];
  if (!roomRow) {
    return undefined;
  }
  const [playerRows, stateRows] = await Promise.all([
    queryDb<RoomPlayerRow>('SELECT * FROM room_players WHERE room_id = $1 ORDER BY joined_at ASC', [roomId]),
    queryDb<RoomGameStateRow>('SELECT * FROM room_game_states WHERE room_id = $1 LIMIT 1', [roomId]),
  ]);
  const stateRow = stateRows[0];
  if (!stateRow) {
    throw new Error('ROOM_STATE_NOT_FOUND');
  }
  return mapRoom(roomRow, playerRows, stateRow);
};

const persistRoomGameStateDb = async (client: DbClient, room: GameRoom): Promise<void> => {
  await client.query(
    `UPDATE host_rooms
      SET status = $2,
          updated_at = NOW()
      WHERE id = $1`,
    [room.id, room.status],
  );
  await client.query(
    `UPDATE room_game_states
      SET current_turn_player_id = $2,
          per_player_state_json = $3::jsonb,
          move_history_json = $4::jsonb,
          active_card_json = $5::jsonb,
          notes_json = $6::jsonb,
          settings_json = $7::jsonb,
          updated_at = NOW()
      WHERE room_id = $1`,
    [
      room.id,
      room.gameState.currentTurnPlayerId,
      JSON.stringify(room.gameState.perPlayerState),
      JSON.stringify(room.gameState.moveHistory),
      JSON.stringify(room.gameState.activeCard),
      JSON.stringify(room.gameState.notes),
      JSON.stringify(room.gameState.settings),
    ],
  );
};

const createHostRoomInMemory = ({
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
  const roomCode = generateRoomCode();
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
      perPlayerState: { [hostUserId]: hostState },
      moveHistory: [],
      activeCard: null,
      notes: {
        hostByCell: {},
        playerByUserId: {},
      },
      settings: getInitialRoomSettings(),
    },
  };
  return storeInMemory(room);
};

export const createHostRoom = async ({
  hostUserId,
  hostDisplayName,
  boardType,
}: {
  hostUserId: string;
  hostDisplayName?: string;
  boardType: RoomBoardType;
}): Promise<RoomSnapshot> => {
  if (!isPostgresEnabled()) {
    return createHostRoomInMemory({ hostUserId, hostDisplayName, boardType });
  }

  return withDbTransaction(async (client) => {
    const now = new Date().toISOString();
    let roomCode = '';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate = generateRoomCode();
      const existing = await client.query<{ exists: number }>('SELECT 1 AS exists FROM host_rooms WHERE room_code = $1 LIMIT 1', [candidate]);
      if (!existing.rows[0]) {
        roomCode = candidate;
        break;
      }
    }
    if (!roomCode) {
      throw new Error('Unable to allocate room code');
    }

    const roomId = randomUUID();
    const hostPlayerId = randomUUID();
    const hostDisplay = resolveDisplayName(hostUserId, hostDisplayName);
    const gameState: RoomGameState = {
      roomId,
      currentTurnPlayerId: hostUserId,
      perPlayerState: {
        [hostUserId]: {
          userId: hostUserId,
          currentCell: 1,
          status: 'in_progress',
          notesCount: 0,
        },
      },
      moveHistory: [],
      activeCard: null,
      notes: {
        hostByCell: {},
        playerByUserId: {},
      },
      settings: getInitialRoomSettings(),
    };

    await client.query(
      `INSERT INTO host_rooms (id, room_code, host_user_id, board_type, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)`,
      [roomId, roomCode, hostUserId, boardType, 'open', now, now],
    );
    await client.query(
      `INSERT INTO room_players (id, room_id, user_id, display_name, role, token_color, joined_at, connection_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8)`,
      [hostPlayerId, roomId, hostUserId, hostDisplay, 'host', TOKEN_COLORS[0], now, 'online'],
    );
    await client.query(
      `INSERT INTO room_game_states (
         room_id,
         current_turn_player_id,
         per_player_state_json,
         move_history_json,
         active_card_json,
         notes_json,
         settings_json,
         updated_at
       )
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::timestamptz)`,
      [
        roomId,
        hostUserId,
        JSON.stringify(gameState.perPlayerState),
        JSON.stringify([]),
        JSON.stringify(null),
        JSON.stringify(gameState.notes),
        JSON.stringify(gameState.settings),
        now,
      ],
    );
    const created = await queryRoomByIdDb(client, roomId);
    if (!created) {
      throw new Error('ROOM_NOT_FOUND');
    }
    return storeInMemory(created);
  });
};

export const getRoomById = async (roomId: string): Promise<RoomSnapshot | undefined> => {
  if (!isPostgresEnabled()) {
    const room = roomsById.get(roomId);
    return room ? toSnapshot(room) : undefined;
  }
  const room = await getDbRoomById(roomId);
  return room ? storeInMemory(room) : undefined;
};

export const getRoomByCode = async (code: string): Promise<RoomSnapshot | undefined> => {
  const normalizedCode = code.trim().toUpperCase();
  if (!isPostgresEnabled()) {
    const roomId = roomsByCode.get(normalizedCode);
    const room = roomId ? roomsById.get(roomId) : undefined;
    return room ? toSnapshot(room) : undefined;
  }
  const rows = await queryDb<HostRoomRow>('SELECT * FROM host_rooms WHERE room_code = $1 LIMIT 1', [normalizedCode]);
  if (!rows[0]) {
    return undefined;
  }
  const room = await getDbRoomById(rows[0].id);
  return room ? storeInMemory(room) : undefined;
};

export const joinRoom = async ({ roomId, userId, displayName }: { roomId: string; userId: string; displayName?: string }): Promise<RoomSnapshot> => {
  if (!isPostgresEnabled()) {
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
    room.gameState.perPlayerState[userId] = { userId, currentCell: 1, status: 'in_progress', notesCount: 0 };
    room.gameState.notes.playerByUserId[userId] ??= {};
    if (!room.gameState.currentTurnPlayerId) {
      room.gameState.currentTurnPlayerId = userId;
    }
    touchRoom(room);
    return toSnapshot(room);
  }

  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    const existing = room.players.find((player) => player.userId === userId);
    if (existing) {
      await client.query('UPDATE room_players SET connection_status = $3 WHERE room_id = $1 AND user_id = $2', [roomId, userId, 'online']);
      const updated = await queryRoomByIdDb(client, roomId);
      if (!updated) {
        throw new Error('ROOM_NOT_FOUND');
      }
      return storeInMemory(updated);
    }
    if (room.players.length >= MAX_ROOM_PLAYERS) {
      throw new Error('ROOM_FULL');
    }
    if (room.status === 'finished') {
      throw new Error('ROOM_FINISHED');
    }

    const now = new Date().toISOString();
    await client.query(
      `INSERT INTO room_players (id, room_id, user_id, display_name, role, token_color, joined_at, connection_status)
       VALUES ($1, $2, $3, $4, 'player', $5, $6::timestamptz, 'online')`,
      [
        randomUUID(),
        roomId,
        userId,
        resolveDisplayName(userId, displayName),
        TOKEN_COLORS[room.players.length % TOKEN_COLORS.length],
        now,
      ],
    );
    room.gameState.perPlayerState[userId] = { userId, currentCell: 1, status: 'in_progress', notesCount: 0 };
    room.gameState.notes.playerByUserId[userId] ??= {};
    if (!room.gameState.currentTurnPlayerId) {
      room.gameState.currentTurnPlayerId = userId;
    }
    await persistRoomGameStateDb(client, room);
    const updated = await queryRoomByIdDb(client, roomId);
    if (!updated) {
      throw new Error('ROOM_NOT_FOUND');
    }
    return storeInMemory(updated);
  });
};

export const setRoomConnectionState = async (roomId: string, userId: string, status: RoomConnectionStatus): Promise<RoomSnapshot> => {
  if (!isPostgresEnabled()) {
    const room = ensureRoom(roomId);
    const player = ensurePlayerInRoom(room, userId);
    player.connectionStatus = status;
    touchRoom(room);
    return toSnapshot(room);
  }
  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    ensurePlayerInRoom(room, userId);
    await client.query('UPDATE room_players SET connection_status = $3 WHERE room_id = $1 AND user_id = $2', [roomId, userId, status]);
    const updated = await queryRoomByIdDb(client, roomId);
    if (!updated) {
      throw new Error('ROOM_NOT_FOUND');
    }
    return storeInMemory(updated);
  });
};

export const startRoom = async (roomId: string, hostUserId: string): Promise<RoomSnapshot> => {
  if (!isPostgresEnabled()) {
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
  }
  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    if (room.hostUserId !== hostUserId) {
      throw new Error('FORBIDDEN');
    }
    room.status = 'in_progress';
    if (!room.gameState.currentTurnPlayerId && room.players[0]) {
      room.gameState.currentTurnPlayerId = room.players[0].userId;
    }
    await persistRoomGameStateDb(client, room);
    const updated = await queryRoomByIdDb(client, roomId);
    if (!updated) {
      throw new Error('ROOM_NOT_FOUND');
    }
    return storeInMemory(updated);
  });
};

export const setRoomStatus = async (roomId: string, hostUserId: string, status: RoomStatus): Promise<RoomSnapshot> => {
  if (!isPostgresEnabled()) {
    const room = ensureRoom(roomId);
    if (room.hostUserId !== hostUserId) {
      throw new Error('FORBIDDEN');
    }
    room.status = status;
    touchRoom(room);
    return toSnapshot(room);
  }
  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    if (room.hostUserId !== hostUserId) {
      throw new Error('FORBIDDEN');
    }
    room.status = status;
    await persistRoomGameStateDb(client, room);
    const updated = await queryRoomByIdDb(client, roomId);
    if (!updated) {
      throw new Error('ROOM_NOT_FOUND');
    }
    return storeInMemory(updated);
  });
};

export const recordRoomNote = async ({
  roomId,
  userId,
  cellNumber,
  note,
  scope,
}: {
  roomId: string;
  userId: string;
  cellNumber: number;
  note: string;
  scope: 'host' | 'player';
}): Promise<RoomSnapshot> => {
  if (!isPostgresEnabled()) {
    const room = ensureRoom(roomId);
    const player = ensurePlayerInRoom(room, userId);
    if (scope === 'host' && player.role !== 'host') {
      throw new Error('FORBIDDEN');
    }
    if (scope === 'host') {
      room.gameState.notes.hostByCell[String(cellNumber)] = note;
    } else {
      room.gameState.notes.playerByUserId[userId] ??= {};
      room.gameState.notes.playerByUserId[userId][String(cellNumber)] = note;
      const playerState = room.gameState.perPlayerState[userId];
      if (playerState) {
        playerState.notesCount += 1;
      }
    }
    touchRoom(room);
    return toSnapshot(room);
  }
  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    const player = ensurePlayerInRoom(room, userId);
    if (scope === 'host' && player.role !== 'host') {
      throw new Error('FORBIDDEN');
    }
    if (scope === 'host') {
      room.gameState.notes.hostByCell[String(cellNumber)] = note;
    } else {
      room.gameState.notes.playerByUserId[userId] ??= {};
      room.gameState.notes.playerByUserId[userId][String(cellNumber)] = note;
      const playerState = room.gameState.perPlayerState[userId];
      if (playerState) {
        playerState.notesCount += 1;
      }
    }
    await persistRoomGameStateDb(client, room);
    const updated = await queryRoomByIdDb(client, roomId);
    if (!updated) {
      throw new Error('ROOM_NOT_FOUND');
    }
    return storeInMemory(updated);
  });
};

export const closeRoomCard = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}): Promise<RoomSnapshot> => {
  const closeInRoom = (room: GameRoom): RoomSnapshot => {
    const player = ensurePlayerInRoom(room, userId);
    if (!room.gameState.activeCard) {
      return toSnapshot(room);
    }
    if (player.role !== 'host' && room.gameState.activeCard.playerUserId !== userId) {
      throw new Error('FORBIDDEN');
    }
    room.gameState.activeCard = null;
    touchRoom(room);
    return toSnapshot(room);
  };

  if (!isPostgresEnabled()) {
    return closeInRoom(ensureRoom(roomId));
  }

  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    const snapshot = closeInRoom(room);
    await persistRoomGameStateDb(client, room);
    return snapshot;
  });
};

export const updateRoomSettings = async ({
  roomId,
  hostUserId,
  patch,
}: {
  roomId: string;
  hostUserId: string;
  patch: Partial<RoomGameState['settings']>;
}): Promise<RoomSnapshot> => {
  const applyPatch = (room: GameRoom): RoomSnapshot => {
    if (room.hostUserId !== hostUserId) {
      throw new Error('FORBIDDEN');
    }
    room.gameState.settings = {
      ...room.gameState.settings,
      ...patch,
    };
    touchRoom(room);
    return toSnapshot(room);
  };
  if (!isPostgresEnabled()) {
    return applyPatch(ensureRoom(roomId));
  }
  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    const snapshot = applyPatch(room);
    await persistRoomGameStateDb(client, room);
    return snapshot;
  });
};

export const updateRoomPlayerTokenColor = async ({
  roomId,
  userId,
  tokenColor,
}: {
  roomId: string;
  userId: string;
  tokenColor: string;
}): Promise<RoomSnapshot> => {
  const normalizedColor = tokenColor.trim();
  if (!normalizedColor) {
    throw new Error('INVALID_TOKEN_COLOR');
  }

  const applyUpdate = (room: GameRoom): RoomSnapshot => {
    const player = ensurePlayerInRoom(room, userId);
    player.tokenColor = normalizedColor;
    touchRoom(room);
    return toSnapshot(room);
  };

  if (!isPostgresEnabled()) {
    return applyUpdate(ensureRoom(roomId));
  }

  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    ensurePlayerInRoom(room, userId);
    await client.query(
      'UPDATE room_players SET token_color = $3 WHERE room_id = $1 AND user_id = $2',
      [roomId, userId, normalizedColor],
    );
    const updated = await queryRoomByIdDb(client, roomId);
    if (!updated) {
      throw new Error('ROOM_NOT_FOUND');
    }
    return storeInMemory(updated);
  });
};

export const rollDiceForCurrentPlayer = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}): Promise<{
  snapshot: RoomSnapshot;
  move: { userId: string; fromCell: number; toCell: number; dice: number; diceValues: number[]; snakeOrArrow: 'snake' | 'arrow' | null; nextTurnPlayerId: string };
}> => {
  const executeMove = (room: GameRoom) => {
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
    const { values: diceValues, total: dice } = rollDiceByMode(room.gameState.settings.diceMode);
    const { fromCell, toCell, snakeOrArrow } = nextMoveFromDice(room.boardType, playerState.currentCell, dice);
    playerState.currentCell = toCell;
    if (toCell >= transitionsByBoard[room.boardType].maxCell) {
      playerState.status = 'finished';
    }
    const nextTurnPlayerId = findNextTurnPlayerId(room, userId);
    room.gameState.currentTurnPlayerId = nextTurnPlayerId;
    room.gameState.moveHistory.push({ userId, fromCell, toCell, dice, diceValues, snakeOrArrow, timestamp: new Date().toISOString() });
    room.gameState.activeCard = {
      cellNumber: toCell,
      playerUserId: userId,
      openedAt: new Date().toISOString(),
    };
    touchRoom(room);
    return { room, move: { userId, fromCell, toCell, dice, diceValues, snakeOrArrow, nextTurnPlayerId } };
  };

  if (!isPostgresEnabled()) {
    const room = ensureRoom(roomId);
    const result = executeMove(room);
    return { snapshot: toSnapshot(result.room), move: result.move };
  }

  return withDbTransaction(async (client) => {
    const room = await queryRoomByIdDb(client, roomId, true);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    const result = executeMove(room);
    await persistRoomGameStateDb(client, result.room);
    const updated = await queryRoomByIdDb(client, roomId);
    if (!updated) {
      throw new Error('ROOM_NOT_FOUND');
    }
    return { snapshot: storeInMemory(updated), move: result.move };
  });
};

export const clearRoomsStore = async (): Promise<void> => {
  roomsById.clear();
  roomsByCode.clear();
  if (!isPostgresEnabled()) {
    return;
  }
  await queryDb('DELETE FROM room_players');
  await queryDb('DELETE FROM room_game_states');
  await queryDb('DELETE FROM host_rooms');
};
