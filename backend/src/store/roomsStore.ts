import { randomUUID } from 'node:crypto';
import type { GameRoom } from '../types/rooms.js';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;

const roomsByCode = new Map<string, GameRoom>();

const generateRoomCode = (): string => {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[randomIndex];
  }
  return code;
};

const getUniqueRoomCode = (): string => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateRoomCode();
    if (!roomsByCode.has(code)) {
      return code;
    }
  }
  throw new Error('Unable to allocate room code');
};

export const createRoom = (ownerUserId: string): GameRoom => {
  const now = new Date().toISOString();
  const room: GameRoom = {
    id: randomUUID(),
    code: getUniqueRoomCode(),
    ownerUserId,
    createdAt: now,
    status: 'draft',
  };

  roomsByCode.set(room.code, room);
  return room;
};

export const getRoomByCode = (code: string): GameRoom | undefined => roomsByCode.get(code.toUpperCase());

export const clearRoomsStore = (): void => {
  roomsByCode.clear();
};
