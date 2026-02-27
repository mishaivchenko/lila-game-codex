export type RoomStatus = 'open' | 'in_progress' | 'paused' | 'finished';
export type RoomBoardType = 'short' | 'full';
export type RoomPlayerRole = 'host' | 'player';
export type RoomConnectionStatus = 'online' | 'offline';
export type RoomDiceMode = 'classic' | 'fast' | 'triple';

export interface RoomPlayer {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  role: RoomPlayerRole;
  tokenColor: string;
  joinedAt: string;
  connectionStatus: RoomConnectionStatus;
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

export interface GameRoom {
  id: string;
  code: string;
  hostUserId: string;
  boardType: RoomBoardType;
  createdAt: string;
  updatedAt: string;
  status: RoomStatus;
  players: RoomPlayer[];
  gameState: RoomGameState;
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
