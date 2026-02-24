import { BOARD_DEFINITIONS } from '../content/boards';
import type { BoardType, GameSession } from '../domain/types';
import type { GameAction, GameState } from './gameContextTypes';

export const initialGameState: GameState = {
  loading: false,
};

const normalizeBoardType = (boardType: unknown): BoardType =>
  boardType === 'short' || boardType === 'full' ? boardType : 'full';

export const normalizeSession = (session: GameSession): GameSession => {
  const normalizedBoardType = normalizeBoardType(session.boardType);
  const board = BOARD_DEFINITIONS[normalizedBoardType];
  const normalizedCell = Math.min(Math.max(session.currentCell || 1, 1), board.maxCell);

  return {
    ...session,
    boardType: normalizedBoardType,
    currentCell: normalizedCell,
    sessionStatus: session.finished ? 'completed' : (session.sessionStatus ?? 'active'),
    hasEnteredGame: Boolean(session.hasEnteredGame),
  };
};

export const gameContextReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'NEW_SESSION_STARTED':
    case 'MOVE_PERFORMED':
    case 'SESSION_FINISHED':
      return { ...state, currentSession: action.payload, loading: false, error: undefined };
    case 'INSIGHT_SAVED':
      return { ...state, loading: false, error: undefined };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

