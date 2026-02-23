export type RoomStatus = 'draft' | 'active' | 'finished';

export interface GameRoom {
  id: string;
  code: string;
  ownerUserId: string;
  createdAt: string;
  status: RoomStatus;
}
