import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logEvent } from '../api/eventsApi';
import { BOARD_DEFINITIONS } from '../content/boards';
import { computeNextPosition, rollDiceByMode } from '../domain/gameEngine';
import type { CellInsight, GameMove, GameSession } from '../domain/types';
import type { RepositoryContainer } from '../repositories';
import { normalizeSession } from './gameContextReducer';
import type { DispatchGameAction, GameContextValue } from './gameContextTypes';

interface UseGameContextActionsParams {
  repositories: RepositoryContainer;
  dispatch: DispatchGameAction;
  currentSession?: GameSession;
  diceRng?: () => number;
}

export const useGameContextActions = ({
  repositories,
  dispatch,
  currentSession,
  diceRng,
}: UseGameContextActionsParams): Pick<
  GameContextValue,
  'startNewSession' | 'resumeLastSession' | 'performMove' | 'finishSession' | 'saveInsight' | 'updateSessionRequest'
> => {
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
    [dispatch, repositories.sessionsRepository],
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
  }, [dispatch, repositories.sessionsRepository]);

  const performMove = useCallback<GameContextValue['performMove']>(async (forcedDice?: number) => {
    if (!currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'Спочатку розпочніть сесію.' });
      return undefined;
    }

    try {
      const normalizedSession = normalizeSession(currentSession);
      if (normalizedSession.finished || normalizedSession.sessionStatus === 'completed') {
        dispatch({ type: 'SET_ERROR', payload: 'Сесію завершено. Почніть нову подорож.' });
        return undefined;
      }
      const diceMode = normalizedSession.settings.diceMode;
      const minByMode = diceMode === 'classic' ? 1 : diceMode === 'fast' ? 2 : 3;
      const maxByMode = diceMode === 'classic' ? 6 : diceMode === 'fast' ? 12 : 18;
      const dice = typeof forcedDice === 'number'
        ? Math.min(maxByMode, Math.max(minByMode, Math.round(forcedDice)))
        : rollDiceByMode(diceMode, diceRng).total;
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
  }, [currentSession, diceRng, dispatch, repositories.movesRepository, repositories.sessionsRepository]);

  const finishSession = useCallback<GameContextValue['finishSession']>(async () => {
    if (!currentSession) {
      dispatch({ type: 'SET_ERROR', payload: 'Немає активної сесії.' });
      return;
    }

    try {
      const normalizedSession = normalizeSession(currentSession);
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
  }, [currentSession, dispatch, repositories.sessionsRepository]);

  const saveInsight = useCallback<GameContextValue['saveInsight']>(
    async (cellNumber, text, voiceNoteId) => {
      if (!currentSession) {
        dispatch({ type: 'SET_ERROR', payload: 'Немає активної сесії.' });
        return;
      }

      try {
        const insight: CellInsight = {
          id: uuidv4(),
          sessionId: currentSession.id,
          cellNumber,
          text,
          voiceNoteId,
          createdAt: new Date().toISOString(),
        };
        await repositories.insightsRepository.saveInsight(insight);
        dispatch({ type: 'INSIGHT_SAVED' });
        void logEvent({
          eventType: 'insight_saved',
          sessionId: currentSession.id,
          timestamp: insight.createdAt,
          payload: { cellNumber },
        });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Не вдалося зберегти нотатку.' });
      }
    },
    [currentSession, dispatch, repositories.insightsRepository],
  );

  const updateSessionRequest = useCallback<GameContextValue['updateSessionRequest']>(
    async (patch) => {
      if (!currentSession) {
        dispatch({ type: 'SET_ERROR', payload: 'Немає активної сесії.' });
        return;
      }

      const requestPatch =
        typeof patch === 'string'
          ? { simpleRequest: patch }
          : patch;

      const nextRequest = {
        ...currentSession.request,
        ...requestPatch,
      };

      try {
        const updatedSession = await repositories.sessionsRepository.updateSession(
          currentSession.id,
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
    [currentSession, dispatch, repositories.sessionsRepository],
  );

  return {
    startNewSession,
    resumeLastSession,
    performMove,
    finishSession,
    saveInsight,
    updateSessionRequest,
  };
};
