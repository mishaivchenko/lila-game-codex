import type {
  BoardType,
  DiceMode,
  DepthSetting,
  GameMove,
  GameRequest,
  GameSession,
} from '../domain/types';

export interface GameState {
  currentSession?: GameSession;
  loading: boolean;
  error?: string;
}

export type GameAction =
  | { type: 'NEW_SESSION_STARTED'; payload: GameSession }
  | { type: 'MOVE_PERFORMED'; payload: GameSession }
  | { type: 'INSIGHT_SAVED' }
  | { type: 'SESSION_FINISHED'; payload: GameSession }
  | { type: 'SET_ERROR'; payload?: string }
  | { type: 'SET_LOADING'; payload: boolean };

export interface GameContextValue extends GameState {
  startNewSession: (
    boardType: BoardType,
    request: GameRequest,
    settings: { diceMode: DiceMode; depth: DepthSetting },
  ) => Promise<void>;
  resumeLastSession: () => Promise<void>;
  performMove: (forcedDice?: number) => Promise<GameMove | undefined>;
  finishSession: () => Promise<void>;
  saveInsight: (cellNumber: number, text: string, voiceNoteId?: string) => Promise<void>;
  updateSessionRequest: (patch: string | Partial<GameRequest>) => Promise<void>;
}

export interface InsightSaveInput {
  cellNumber: number;
  text: string;
  voiceNoteId?: string;
}

export type DispatchGameAction = (action: GameAction) => void;
