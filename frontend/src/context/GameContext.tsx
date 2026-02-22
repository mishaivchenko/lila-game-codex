import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logEvent } from '../api/eventsApi';
import { BOARD_DEFINITIONS } from '../content/boards';
import { computeNextPosition, rollDice } from '../domain/gameEngine';
import type {
  BoardType,
  CellInsight,
  DepthSetting,
  GameRequest,
  GameSession,
  GameMove,
  SpeedSetting,
} from '../domain/types';
import { createRepositories, type RepositoryContainer } from '../repositories';

export interface GameState {
  currentSession?: GameSession;
  loading: boolean;
  error?: string;
}

type GameAction =
  | { type: 'NEW_SESSION_STARTED'; payload: GameSession }
  | { type: 'MOVE_PERFORMED'; payload: GameSession }
  | { type: 'INSIGHT_SAVED' }
  | { type: 'SESSION_FINISHED'; payload: GameSession }
  | { type: 'SET_ERROR'; payload?: string }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: GameState = {
  loading: false,
};

const reducer = (state: GameState, action: GameAction): GameState => {
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

export interface GameContextValue extends GameState {
  startNewSession: (
    boardType: BoardType,
    request: GameRequest,
    settings: { speed: SpeedSetting; depth: DepthSetting },
  ) => Promise<void>;
  resumeLastSession: () => Promise<void>;
  performMove: () => Promise<GameMove | undefined>;
  saveInsight: (cellNumber: number, text: string, voiceNoteId?: string) => Promise<void>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const defaultRepositories = createRepositories();

interface GameProviderProps {
  children: React.ReactNode;
  repositories?: RepositoryContainer;
  diceRng?: () => number;
}

export const GameProvider = ({
  children,
  repositories = defaultRepositories,
  diceRng,
}: GameProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startNewSession = useCallback<GameContextValue['startNewSession']>(
    async (boardType, request, settings) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const now = new Date().toISOString();
        const session: GameSession = {
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          boardType,
          currentCell: 1,
          settings,
          request,
          finished: false,
          hasEnteredGame: false,
        };
        await repositories.sessionsRepository.saveSession(session);
        dispatch({ type: 'NEW_SESSION_STARTED', payload: session });
        void logEvent({ eventType: 'game_started', sessionId: session.id, timestamp: now });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Не вдалося почати нову сесію.' });
      }
    },
    [repositories.sessionsRepository],
  );

  const resumeLastSession = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const session = await repositories.sessionsRepository.getLastActiveSession();
      if (!session) {
        dispatch({ type: 'SET_ERROR', payload: 'Активну сесію не знайдено.' });
        return;
      }
      dispatch({ type: 'NEW_SESSION_STARTED', payload: session });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Не вдалося відновити сесію.' });
    }
  }, [repositories.sessionsRepository]);

  const performMove = useCallback(async () => {
    if (!state.currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'Спочатку розпочніть сесію.' });
      return undefined;
    }

    try {
      const dice = rollDice(diceRng);
      const board = BOARD_DEFINITIONS[state.currentSession.boardType];
      const next = computeNextPosition(
        state.currentSession.currentCell,
        dice,
        board,
        state.currentSession.hasEnteredGame,
      );
      const now = new Date().toISOString();
      const nextMoveNumber = await repositories.movesRepository.getNextMoveNumber(state.currentSession.id);

      const move: GameMove = {
        id: uuidv4(),
        sessionId: state.currentSession.id,
        moveNumber: nextMoveNumber,
        fromCell: next.fromCell,
        toCell: next.toCell,
        dice: next.dice,
        snakeOrArrow: next.snakeOrArrow,
        createdAt: now,
      };

      const sessionPatch: Partial<GameSession> = {
        currentCell: next.toCell,
        finished: next.finished,
        hasEnteredGame: next.hasEnteredGame,
        finishedAt: next.finished ? now : undefined,
      };

      const updatedSession = await repositories.sessionsRepository.updateSession(
        state.currentSession.id,
        sessionPatch,
      );

      if (!updatedSession) {
        dispatch({ type: 'SET_ERROR', payload: 'Не вдалося оновити сесію.' });
        return undefined;
      }

      await repositories.movesRepository.saveMove(move);

      dispatch({ type: next.finished ? 'SESSION_FINISHED' : 'MOVE_PERFORMED', payload: updatedSession });
      void logEvent({
        eventType: next.finished ? 'game_finished' : 'move_performed',
        sessionId: updatedSession.id,
        timestamp: now,
        payload: { fromCell: move.fromCell, toCell: move.toCell, dice: move.dice },
      });
      return move;
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Хід не виконано. Спробуйте ще раз.' });
      return undefined;
    }
  }, [diceRng, repositories.movesRepository, repositories.sessionsRepository, state.currentSession]);

  const saveInsight = useCallback<GameContextValue['saveInsight']>(
    async (cellNumber, text, voiceNoteId) => {
      if (!state.currentSession) {
        dispatch({ type: 'SET_ERROR', payload: 'Немає активної сесії.' });
        return;
      }

      try {
        const insight: CellInsight = {
          id: uuidv4(),
          sessionId: state.currentSession.id,
          cellNumber,
          text,
          voiceNoteId,
          createdAt: new Date().toISOString(),
        };
        await repositories.insightsRepository.saveInsight(insight);
        dispatch({ type: 'INSIGHT_SAVED' });
        void logEvent({
          eventType: 'insight_saved',
          sessionId: state.currentSession.id,
          timestamp: insight.createdAt,
          payload: { cellNumber },
        });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Не вдалося зберегти нотатку.' });
      }
    },
    [repositories.insightsRepository, state.currentSession],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      startNewSession,
      resumeLastSession,
      performMove,
      saveInsight,
    }),
    [performMove, resumeLastSession, saveInsight, startNewSession, state],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used inside GameProvider');
  }
  return context;
};
