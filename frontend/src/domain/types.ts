export type BoardType = 'short' | 'full';

export type SpeedSetting = 'slow' | 'normal' | 'fast';
export type DepthSetting = 'light' | 'standard' | 'deep';

export interface CellContent {
  title: string;
  shortText: string;
  fullText: string;
  questions: string[];
}

export interface BoardDefinition {
  id: BoardType;
  cells: CellContent[];
  snakes: { from: number; to: number }[];
  arrows: { from: number; to: number }[];
  maxCell: number;
}

export interface GameRequest {
  simpleRequest?: string;
  need?: string;
  question?: string;
  isDeepEntry: boolean;
  area?: string;
  feelings?: string[];
  outcome?: string;
}

export interface GameSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  boardType: BoardType;
  currentCell: number;
  settings: {
    speed: SpeedSetting;
    depth: DepthSetting;
  };
  request: GameRequest;
  sessionStatus: 'active' | 'completed';
  finished: boolean;
  finishedAt?: string;
  hasEnteredGame: boolean;
}

export interface GameMove {
  id: string;
  sessionId: string;
  moveNumber: number;
  fromCell: number;
  toCell: number;
  dice: number;
  moveType?: 'normal' | 'snake' | 'ladder';
  snakeOrArrow?: 'snake' | 'arrow' | null;
  createdAt: string;
}

export interface CellInsight {
  id: string;
  sessionId: string;
  cellNumber: number;
  text?: string;
  voiceNoteId?: string;
  createdAt: string;
}

export interface SettingsEntity {
  id: 'global';
  soundEnabled: boolean;
  musicEnabled: boolean;
  defaultSpeed: SpeedSetting;
  defaultDepth: DepthSetting;
  selectedThemeId: string;
  tokenColorId?: string;
  animationSpeed?: SpeedSetting;
}

export interface ChakraInfo {
  id: string;
  name: string;
  description: string;
  rowStart: number;
  rowEnd: number;
}

export interface ComputedMove {
  fromCell: number;
  toCell: number;
  dice: number;
  snakeOrArrow: 'snake' | 'arrow' | null;
  finished: boolean;
  hasEnteredGame: boolean;
}
