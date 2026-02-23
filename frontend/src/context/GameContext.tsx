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

const normalizeBoardType = (boardType: unknown): BoardType =>
  boardType === 'short' || boardType === 'full' ? boardType : 'full';

const normalizeSession = (session: GameSession): GameSession => {
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
  performMove: (forcedDice?: number) => Promise<GameMove | undefined>;
  finishSession: () => Promise<void>;
  saveInsight: (cellNumber: number, text: string, voiceNoteId?: string) => Promise<void>;
  updateSessionRequest: (patch: string | Partial<GameRequest>) => Promise<void>;
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
          sessionStatus: 'active',
          finished: false,
          hasEnteredGame: false,
        };
        const normalizedSession = normalizeSession(session);
        await repositories.sessionsRepository.saveSession(normalizedSession);
        dispatch({ type: 'NEW_SESSION_STARTED', payload: normalizedSession });
        void logEvent({ eventType: 'game_started', sessionId: normalizedSession.id, timestamp: now });
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
      const normalizedSession = normalizeSession(session);

      if (
        normalizedSession.boardType !== session.boardType ||
        normalizedSession.currentCell !== session.currentCell ||
        normalizedSession.hasEnteredGame !== session.hasEnteredGame ||
        normalizedSession.sessionStatus !== session.sessionStatus
      ) {
        await repositories.sessionsRepository.updateSession(session.id, {
          boardType: normalizedSession.boardType,
          currentCell: normalizedSession.currentCell,
          hasEnteredGame: normalizedSession.hasEnteredGame,
          sessionStatus: normalizedSession.sessionStatus,
        });
      }

      dispatch({ type: 'NEW_SESSION_STARTED', payload: normalizedSession });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Не вдалося відновити сесію.' });
    }
  }, [repositories.sessionsRepository]);

  const performMove = useCallback(async (forcedDice?: number) => {
    if (!state.currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'Спочатку розпочніть сесію.' });
      return undefined;
    }

    try {
      const normalizedSession = normalizeSession(state.currentSession);
      if (normalizedSession.finished || normalizedSession.sessionStatus === 'completed') {
        dispatch({ type: 'SET_ERROR', payload: 'Сесію завершено. Почніть нову подорож.' });
        return undefined;
      }
      const dice = typeof forcedDice === 'number' ? Math.min(6, Math.max(1, Math.round(forcedDice))) : rollDice(diceRng);
      const board = BOARD_DEFINITIONS[normalizedSession.boardType];
      const deepEntryGate =
        normalizedSession.request.isDeepEntry && !normalizedSession.hasEnteredGame;
      const next = deepEntryGate
        ? {
            fromCell: 1,
            toCell: 1,
            dice,
            snakeOrArrow: null,
            finished: false,
            hasEnteredGame: dice === 6,
          }
        : computeNextPosition(
            normalizedSession.currentCell,
            dice,
            board,
            normalizedSession.hasEnteredGame,
          );
      const now = new Date().toISOString();
      const nextMoveNumber = await repositories.movesRepository.getNextMoveNumber(normalizedSession.id);

      const move: GameMove = {
        id: uuidv4(),
        sessionId: normalizedSession.id,
        moveNumber: nextMoveNumber,
        fromCell: next.fromCell,
        toCell: next.toCell,
        dice: next.dice,
        moveType:
          next.snakeOrArrow === 'snake'
            ? 'snake'
            : next.snakeOrArrow === 'arrow'
              ? 'ladder'
              : 'normal',
        snakeOrArrow: next.snakeOrArrow,
        createdAt: now,
      };

      const sessionPatch: Partial<GameSession> = {
        currentCell: next.toCell,
        finished: next.finished,
        sessionStatus: next.finished ? 'completed' : 'active',
        hasEnteredGame: next.hasEnteredGame,
        finishedAt: next.finished ? now : undefined,
      };

      const updatedSession = await repositories.sessionsRepository.updateSession(
        normalizedSession.id,
        sessionPatch,
      );

      if (!updatedSession) {
        dispatch({ type: 'SET_ERROR', payload: 'Не вдалося оновити сесію.' });
        return undefined;
      }

      await repositories.movesRepository.saveMove(move);

      const normalizedUpdatedSession = normalizeSession(updatedSession);
      dispatch({ type: next.finished ? 'SESSION_FINISHED' : 'MOVE_PERFORMED', payload: normalizedUpdatedSession });
      void logEvent({
        eventType: next.finished ? 'game_finished' : 'move_performed',
        sessionId: normalizedUpdatedSession.id,
        timestamp: now,
        payload: { fromCell: move.fromCell, toCell: move.toCell, dice: move.dice },
      });
      return move;
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Хід не виконано. Спробуйте ще раз.' });
      return undefined;
    }
  }, [diceRng, repositories.movesRepository, repositories.sessionsRepository, state.currentSession]);

  const finishSession = useCallback(async () => {
    if (!state.currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'Немає активної сесії.' });
      return;
    }

    try {
      const normalizedSession = normalizeSession(state.currentSession);
      if (normalizedSession.finished || normalizedSession.sessionStatus === 'completed') {
        dispatch({ type: 'SESSION_FINISHED', payload: normalizedSession });
        return;
      }

      const now = new Date().toISOString();
      const updatedSession = await repositories.sessionsRepository.updateSession(
        normalizedSession.id,
        {
          finished: true,
          sessionStatus: 'completed',
          finishedAt: now,
        },
      );

      if (!updatedSession) {
        dispatch({ type: 'SET_ERROR', payload: 'Не вдалося завершити подорож.' });
        return;
      }

      dispatch({ type: 'SESSION_FINISHED', payload: normalizeSession(updatedSession) });
      void logEvent({
        eventType: 'game_finished',
        sessionId: updatedSession.id,
        timestamp: now,
        payload: { completedManually: true },
      });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Не вдалося завершити подорож.' });
    }
  }, [repositories.sessionsRepository, state.currentSession]);

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

  const updateSessionRequest = useCallback<GameContextValue['updateSessionRequest']>(
    async (patch) => {
      if (!state.currentSession) {
        dispatch({ type: 'SET_ERROR', payload: 'Немає активної сесії.' });
        return;
      }

      const requestPatch =
        typeof patch === 'string'
          ? { simpleRequest: patch }
          : patch;

      const nextRequest = {
        ...state.currentSession.request,
        ...requestPatch,
      };

      try {
        const updatedSession = await repositories.sessionsRepository.updateSession(
          state.currentSession.id,
          { request: nextRequest },
        );

        if (!updatedSession) {
          dispatch({ type: 'SET_ERROR', payload: 'Не вдалося оновити запит.' });
          return;
        }

        const normalizedUpdatedSession = normalizeSession(updatedSession);
        dispatch({
          type: normalizedUpdatedSession.finished ? 'SESSION_FINISHED' : 'MOVE_PERFORMED',
          payload: normalizedUpdatedSession,
        });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Не вдалося оновити запит.' });
      }
    },
    [repositories.sessionsRepository, state.currentSession],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      startNewSession,
      resumeLastSession,
      performMove,
      finishSession,
      saveInsight,
      updateSessionRequest,
    }),
    [finishSession, performMove, resumeLastSession, saveInsight, startNewSession, state, updateSessionRequest],
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
