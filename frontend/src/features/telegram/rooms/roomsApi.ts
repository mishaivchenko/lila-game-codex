import { apiFetch } from '../../../lib/api/apiClient';

export type RoomStatus = 'draft' | 'active' | 'finished';

export interface GameRoom {
  id: string;
  code: string;
  ownerUserId: string;
  createdAt: string;
  status: RoomStatus;
}

interface RoomResponse {
  ok: boolean;
  room: GameRoom;
}

export const createRoomApi = async (token: string): Promise<GameRoom> => {
  const response = await apiFetch('/api/rooms', { method: 'POST' }, token);
  if (!response.ok) {
    throw new Error('Failed to create room');
  }
  const payload = (await response.json()) as RoomResponse;
  return payload.room;
};

export const getRoomByCodeApi = async (token: string, code: string): Promise<GameRoom> => {
  const response = await apiFetch(`/api/rooms/${encodeURIComponent(code.trim().toUpperCase())}`, {}, token);
  if (!response.ok) {
    throw new Error('Room not found');
  }
  const payload = (await response.json()) as RoomResponse;
  return payload.room;
};
