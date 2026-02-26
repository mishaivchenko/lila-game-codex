import { io, type Socket } from 'socket.io-client';
import { apiFetch } from '../../../lib/api/apiClient';

export type RoomStatus = 'open' | 'in_progress' | 'paused' | 'finished';
export type RoomBoardType = 'short' | 'full';
export type RoomPlayerRole = 'host' | 'player';

export interface RoomPlayer {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  role: RoomPlayerRole;
  tokenColor: string;
  joinedAt: string;
  connectionStatus: 'online' | 'offline';
}

export interface RoomPlayerState {
  userId: string;
  currentCell: number;
  status: 'in_progress' | 'finished';
  notesCount: number;
}

export interface RoomGameState {
  roomId: string;
  currentTurnPlayerId: string;
  perPlayerState: Record<string, RoomPlayerState>;
  moveHistory: Array<{
    userId: string;
    fromCell: number;
    toCell: number;
    dice: number;
    snakeOrArrow: 'snake' | 'arrow' | null;
    timestamp: string;
  }>;
}

export interface RoomSnapshot {
  room: {
    id: string;
    code: string;
    hostUserId: string;
    boardType: RoomBoardType;
    status: RoomStatus;
    createdAt: string;
    updatedAt: string;
  };
  players: RoomPlayer[];
  gameState: RoomGameState;
}

const parseSnapshotResponse = async (response: Response): Promise<RoomSnapshot> => {
  if (!response.ok) {
    throw new Error('Room request failed');
  }
  const payload = (await response.json()) as ({ ok: boolean } & RoomSnapshot);
  return {
    room: payload.room,
    players: payload.players,
    gameState: payload.gameState,
  };
};

export const createRoomApi = async (token: string, boardType: RoomBoardType): Promise<RoomSnapshot> => {
  const response = await apiFetch(
    '/api/rooms',
    {
      method: 'POST',
      body: JSON.stringify({ boardType }),
    },
    token,
  );
  return parseSnapshotResponse(response);
};

export const getRoomByCodeApi = async (token: string, code: string): Promise<RoomSnapshot> => {
  const response = await apiFetch(`/api/rooms/code/${encodeURIComponent(code.trim().toUpperCase())}`, {}, token);
  return parseSnapshotResponse(response);
};

export const getRoomByIdApi = async (token: string, roomId: string): Promise<RoomSnapshot> => {
  const response = await apiFetch(`/api/rooms/${encodeURIComponent(roomId)}`, {}, token);
  return parseSnapshotResponse(response);
};

export const joinRoomApi = async (token: string, roomId: string): Promise<RoomSnapshot> => {
  const response = await apiFetch(`/api/rooms/${encodeURIComponent(roomId)}/join`, { method: 'POST' }, token);
  return parseSnapshotResponse(response);
};

export const hostStartRoomApi = async (token: string, roomId: string): Promise<RoomSnapshot> => {
  const response = await apiFetch(`/api/rooms/${encodeURIComponent(roomId)}/start`, { method: 'POST' }, token);
  return parseSnapshotResponse(response);
};

export const hostFinishRoomApi = async (token: string, roomId: string): Promise<RoomSnapshot> => {
  const response = await apiFetch(`/api/rooms/${encodeURIComponent(roomId)}/finish`, { method: 'POST' }, token);
  return parseSnapshotResponse(response);
};

export type HostRoomSocket = Socket<
  {
    roomStateUpdated: (snapshot: RoomSnapshot) => void;
    playerJoined: (payload: { playerId: string; displayName: string }) => void;
    diceRolled: (payload: { playerId: string; dice: number }) => void;
    tokenMoved: (payload: { playerId: string; fromCell: number; toCell: number; snakeOrArrow: 'snake' | 'arrow' | null }) => void;
    roomError: (payload: { message: string }) => void;
  },
  {
    joinRoom: (payload: { roomId: string }) => void;
    rollDice: (payload: { roomId: string }) => void;
    updateNote: (payload: { roomId: string; cell: number; note: string }) => void;
    hostCommand: (payload: { roomId: string; action: 'start' | 'pause' | 'resume' | 'finish' }) => void;
  }
>;

export const createHostRoomSocket = (token: string): HostRoomSocket => {
  const socketUrl = window.location.origin;
  return io(`${socketUrl}/host-room`, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });
};
