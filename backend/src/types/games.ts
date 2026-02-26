export type BoardType = 'short' | 'full';
export type DepthSetting = 'light' | 'standard' | 'deep';
export type DiceMode = 'classic' | 'fast' | 'triple';
export type GameStatus = 'in_progress' | 'finished';

export interface GameRequestPayload {
  simpleRequest?: string;
  need?: string;
  question?: string;
  isDeepEntry: boolean;
  area?: string;
  feelings?: string[];
  outcome?: string;
}

export interface GameSettingsPayload {
  diceMode: DiceMode;
  depth: DepthSetting;
}

export interface GameSessionPayload {
  id: string;
  boardType: BoardType;
  currentCell: number;
  settings: GameSettingsPayload;
  request: GameRequestPayload;
  hasEnteredGame: boolean;
  sessionStatus: 'active' | 'completed';
  finished: boolean;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserGameSession {
  id: string;
  userId: string;
  boardType: BoardType;
  currentCell: number;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
  throwsCount: number;
  hasNotes: boolean;
  payload: GameSessionPayload;
}
