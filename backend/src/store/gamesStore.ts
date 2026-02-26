import { randomUUID } from 'node:crypto';
import type { GameSessionPayload, UserGameSession } from '../types/games.js';

const sessionsById = new Map<string, UserGameSession>();

const inferThrowsCount = (payload: GameSessionPayload, previous: UserGameSession | undefined): number => {
  if (!previous) {
    return 0;
  }
  if (payload.currentCell === previous.payload.currentCell) {
    return previous.throwsCount;
  }
  return previous.throwsCount + 1;
};

const inferStatus = (payload: GameSessionPayload): UserGameSession['status'] =>
  payload.finished || payload.sessionStatus === 'completed' ? 'finished' : 'in_progress';

export const upsertGameSessionForUser = (userId: string, payload: GameSessionPayload): UserGameSession => {
  const now = new Date().toISOString();
  const sessionId = payload.id || randomUUID();
  const previous = sessionsById.get(sessionId);
  const next: UserGameSession = {
    id: sessionId,
    userId,
    boardType: payload.boardType,
    currentCell: payload.currentCell,
    status: inferStatus(payload),
    createdAt: previous?.createdAt ?? payload.createdAt ?? now,
    updatedAt: now,
    finishedAt: payload.finishedAt,
    throwsCount: inferThrowsCount(payload, previous),
    hasNotes: previous?.hasNotes ?? false,
    payload: {
      ...payload,
      id: sessionId,
      updatedAt: now,
      createdAt: previous?.payload.createdAt ?? payload.createdAt ?? now,
    },
  };
  sessionsById.set(sessionId, next);
  return next;
};

export const patchGameSessionForUser = (
  userId: string,
  sessionId: string,
  patch: Partial<GameSessionPayload>,
): UserGameSession | undefined => {
  const existing = sessionsById.get(sessionId);
  if (!existing || existing.userId !== userId) {
    return undefined;
  }

  const mergedPayload: GameSessionPayload = {
    ...existing.payload,
    ...patch,
    id: existing.id,
    createdAt: existing.payload.createdAt,
    updatedAt: new Date().toISOString(),
  };
  return upsertGameSessionForUser(userId, mergedPayload);
};

export const getUserGameSessionById = (userId: string, sessionId: string): UserGameSession | undefined => {
  const session = sessionsById.get(sessionId);
  if (!session || session.userId !== userId) {
    return undefined;
  }
  return session;
};

export const listUserGameSessions = (userId: string, limit = 10): UserGameSession[] => {
  return Array.from(sessionsById.values())
    .filter((session) => session.userId === userId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, limit);
};

export const getUserActiveGameSession = (userId: string): UserGameSession | undefined => {
  return Array.from(sessionsById.values())
    .filter((session) => session.userId === userId && session.status === 'in_progress')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
};

export const clearGamesStore = (): void => {
  sessionsById.clear();
};
