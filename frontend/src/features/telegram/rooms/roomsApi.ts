import { io, type Socket } from 'socket.io-client';
import { apiFetch } from '../../../lib/api/apiClient';

export type RoomStatus = 'open' | 'in_progress' | 'paused' | 'finished';
export type RoomBoardType = 'short' | 'full';
export type RoomPlayerRole = 'host' | 'player';
export type RoomDiceMode = 'classic' | 'fast' | 'triple';
export type RoomNoteScope = 'host' | 'player' | 'host_player';

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

export interface RoomCardState {
  cellNumber: number;
  playerUserId: string;
  openedAt: string;
}

export interface RoomNotesState {
  hostByCell: Record<string, string>;
  hostByPlayerId: Record<string, string>;
  playerByUserId: Record<string, Record<string, string>>;
}

export interface RoomSettings {
  diceMode: RoomDiceMode;
  allowHostCloseAnyCard: boolean;
  hostCanPause: boolean;
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
    diceValues?: number[];
    snakeOrArrow: 'snake' | 'arrow' | null;
    timestamp: string;
  }>;
  activeCard: RoomCardState | null;
  notes: RoomNotesState;
  settings: RoomSettings;
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

export interface RoomDiceRolledPayload {
  playerId: string;
  dice: number;
  diceValues: number[];
}

export interface RoomTokenMovedPayload {
  playerId: string;
  fromCell: number;
  toCell: number;
  snakeOrArrow: 'snake' | 'arrow' | null;
}

export const ROOM_TOKEN_COLOR_PALETTE = ['#1f2937', '#c57b5d', '#2cbfaf', '#8b5cf6', '#ef4444', '#f59e0b'] as const;

const parseSnapshotResponse = async (response: Response): Promise<RoomSnapshot> => {
  if (!response.ok) {
    const payloadText = await response.text().catch(() => '');
    if (payloadText) {
      let parsedError: string | undefined;
      try {
        const payload = JSON.parse(payloadText) as { error?: string };
        parsedError = payload.error;
      } catch {
        // non-json payload, fall back to raw text below
      }
      throw new Error(parsedError ?? payloadText);
    }
    throw new Error(`Room request failed (${response.status})`);
  }
  const payload = (await response.json()) as ({ ok: boolean } & RoomSnapshot);
  return {
    room: payload.room,
    players: payload.players,
    gameState: payload.gameState,
  };
};

const parseRoomRequest = (url: string, init: RequestInit, token: string) => apiFetch(url, init, token).then(parseSnapshotResponse);

export const createRoomApi = async (token: string, boardType: RoomBoardType): Promise<RoomSnapshot> =>
  parseRoomRequest('/api/rooms', { method: 'POST', body: JSON.stringify({ boardType }) }, token);

export const getRoomByCodeApi = async (token: string, code: string): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/code/${encodeURIComponent(code.trim().toUpperCase())}`, {}, token);

export const getRoomByIdApi = async (token: string, roomId: string): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}`, {}, token);

export const listMyRoomsApi = async (token: string): Promise<RoomSnapshot[]> => {
  const response = await apiFetch('/api/rooms', {}, token);
  if (!response.ok) {
    throw new Error(`Failed to load rooms (${response.status})`);
  }
  const payload = await response.json() as { ok: boolean; rooms: RoomSnapshot[] };
  return payload.rooms ?? [];
};

export const joinRoomApi = async (token: string, roomId: string): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/join`, { method: 'POST' }, token);

export const hostStartRoomApi = async (token: string, roomId: string): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/start`, { method: 'POST' }, token);

export const hostFinishRoomApi = async (token: string, roomId: string): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/finish`, { method: 'POST' }, token);

export const hostPauseRoomApi = async (token: string, roomId: string): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/pause`, { method: 'POST' }, token);

export const hostResumeRoomApi = async (token: string, roomId: string): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/resume`, { method: 'POST' }, token);

export const closeRoomCardApi = async (token: string, roomId: string): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/card/close`, { method: 'POST' }, token);

export const saveRoomNoteApi = async (
  token: string,
  roomId: string,
  payload: { cellNumber: number; note: string; scope: RoomNoteScope; targetPlayerId?: string },
): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/notes`, { method: 'POST', body: JSON.stringify(payload) }, token);

export const updateRoomSettingsApi = async (
  token: string,
  roomId: string,
  patch: Partial<RoomSettings>,
): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/settings`, { method: 'PATCH', body: JSON.stringify(patch) }, token);

export const updateRoomPreferencesApi = async (
  token: string,
  roomId: string,
  payload: { tokenColor: string },
): Promise<RoomSnapshot> =>
  parseRoomRequest(`/api/rooms/${encodeURIComponent(roomId)}/preferences`, { method: 'PATCH', body: JSON.stringify(payload) }, token);

export type HostRoomSocket = Socket<
  {
    roomStateUpdated: (snapshot: RoomSnapshot) => void;
    playerJoined: (payload: { playerId: string; displayName: string }) => void;
    diceRolled: (payload: RoomDiceRolledPayload) => void;
    tokenMoved: (payload: RoomTokenMovedPayload) => void;
    cardOpened: (payload: RoomCardState) => void;
    roomError: (payload: { message: string }) => void;
  },
  {
    joinRoom: (payload: { roomId: string }) => void;
    rollDice: (payload: { roomId: string }) => void;
    updateNote: (payload: { roomId: string; cell: number; note: string; scope: RoomNoteScope; targetPlayerId?: string }) => void;
    closeCard: (payload: { roomId: string }) => void;
    updatePlayerPreferences: (payload: { roomId: string; tokenColor: string }) => void;
    hostCommand: (payload: {
      roomId: string;
      action: 'start' | 'pause' | 'resume' | 'finish' | 'updateSettings';
      payload?: Partial<RoomSettings>;
    }) => void;
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
