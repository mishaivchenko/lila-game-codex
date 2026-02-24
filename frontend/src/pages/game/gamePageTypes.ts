import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';

export const SIMPLE_COLOR_HEX: Record<string, string> = {
  червоний: '#ef4444',
  помаранчевий: '#f97316',
  жовтий: '#eab308',
  зелений: '#10b981',
  синій: '#3b82f6',
  фіолетовий: '#8b5cf6',
  рожевий: '#ec4899',
};

export interface SimplePlayerState {
  id: string;
  name: string;
  request: string;
  color: string;
  currentCell: number;
  hasEnteredGame: boolean;
  finished: boolean;
}

export interface SimplePlayerHistoryEntry {
  fromCell: number;
  toCell: number;
  dice: number;
  moveType: 'normal' | 'snake' | 'ladder';
  snakeOrArrow: 'snake' | 'arrow' | null;
  createdAt: string;
}

export interface SimpleMultiplayerPayload {
  players: Array<{
    id: string;
    name: string;
    request: string;
    color: string;
    currentCell: number;
    hasEnteredGame: boolean;
    finished: boolean;
  }>;
  historyByPlayer: Record<string, SimplePlayerHistoryEntry[]>;
}

export type TurnState = 'idle' | 'rolling' | 'animating';
export type ModalMode = 'inspect' | 'move' | 'snake-head' | 'snake-tail';
export type SnakeFlowPhase = 'idle' | 'head-card' | 'tail-animation' | 'tail-card';

export interface CoachMoveContext {
  fromCell: number;
  toCell: number;
  type: 'normal' | 'snake' | 'ladder';
  pathLabel?: string;
}

export interface SnakeFlowState {
  moveId: string;
  headCell: number;
  tailCell: number;
  pathPoints?: BoardPathPoint[];
}

export interface PendingSimpleMove {
  moveId: string;
  playerId: string;
  fromCell: number;
  toCell: number;
  dice: number;
  moveType: 'normal' | 'snake' | 'ladder';
  snakeOrArrow: 'snake' | 'arrow' | null;
  finished: boolean;
  hasEnteredGame: boolean;
  createdAt: string;
}
