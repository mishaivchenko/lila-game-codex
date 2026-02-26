import { randomUUID } from 'node:crypto';
import type { GameSessionPayload, UserGameSession } from '../types/games.js';
import { isPostgresEnabled, queryDb } from '../lib/db.js';

const sessionsById = new Map<string, UserGameSession>();

interface GameSessionRow {
  id: string;
  user_id: string;
  board_type: UserGameSession['boardType'];
  current_cell: number;
  game_status: UserGameSession['status'];
  created_at: string;
  updated_at: string;
  finished_at: string | null;
  throws_count: number;
  has_notes: boolean;
  payload_json: GameSessionPayload;
}

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

const mapRow = (row: GameSessionRow): UserGameSession => ({
  id: row.id,
  userId: row.user_id,
  boardType: row.board_type,
  currentCell: row.current_cell,
  status: row.game_status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  finishedAt: row.finished_at ?? undefined,
  throwsCount: row.throws_count,
  hasNotes: row.has_notes,
  payload: row.payload_json,
});

const storeInMemory = (session: UserGameSession): UserGameSession => {
  sessionsById.set(session.id, session);
  return session;
};

const upsertInMemory = (userId: string, payload: GameSessionPayload): UserGameSession => {
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
  return storeInMemory(next);
};

const getInMemoryById = (userId: string, sessionId: string): UserGameSession | undefined => {
  const session = sessionsById.get(sessionId);
  if (!session || session.userId !== userId) {
    return undefined;
  }
  return session;
};

export const upsertGameSessionForUser = async (userId: string, payload: GameSessionPayload): Promise<UserGameSession> => {
  if (!isPostgresEnabled()) {
    return upsertInMemory(userId, payload);
  }

  const sessionId = payload.id || randomUUID();
  const previous = await getUserGameSessionById(userId, sessionId);
  const now = new Date().toISOString();
  const nextPayload: GameSessionPayload = {
    ...payload,
    id: sessionId,
    createdAt: previous?.payload.createdAt ?? payload.createdAt ?? now,
    updatedAt: now,
  };
  const nextSession: UserGameSession = {
    id: sessionId,
    userId,
    boardType: nextPayload.boardType,
    currentCell: nextPayload.currentCell,
    status: inferStatus(nextPayload),
    createdAt: previous?.createdAt ?? nextPayload.createdAt,
    updatedAt: now,
    finishedAt: nextPayload.finishedAt,
    throwsCount: inferThrowsCount(nextPayload, previous),
    hasNotes: previous?.hasNotes ?? false,
    payload: nextPayload,
  };

  const rows = await queryDb<GameSessionRow>(
    `INSERT INTO game_sessions (
      id,
      user_id,
      board_type,
      current_cell,
      game_status,
      throws_count,
      has_notes,
      payload_json,
      created_at,
      updated_at,
      finished_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz, $10::timestamptz, $11::timestamptz)
    ON CONFLICT (id)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      board_type = EXCLUDED.board_type,
      current_cell = EXCLUDED.current_cell,
      game_status = EXCLUDED.game_status,
      throws_count = EXCLUDED.throws_count,
      has_notes = EXCLUDED.has_notes,
      payload_json = EXCLUDED.payload_json,
      updated_at = EXCLUDED.updated_at,
      finished_at = EXCLUDED.finished_at
    RETURNING *`,
    [
      nextSession.id,
      nextSession.userId,
      nextSession.boardType,
      nextSession.currentCell,
      nextSession.status,
      nextSession.throwsCount,
      nextSession.hasNotes,
      JSON.stringify(nextSession.payload),
      nextSession.createdAt,
      nextSession.updatedAt,
      nextSession.finishedAt ?? null,
    ],
  );
  const session = mapRow(rows[0]);
  return storeInMemory(session);
};

export const patchGameSessionForUser = async (
  userId: string,
  sessionId: string,
  patch: Partial<GameSessionPayload>,
): Promise<UserGameSession | undefined> => {
  const existing = await getUserGameSessionById(userId, sessionId);
  if (!existing) {
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

export const getUserGameSessionById = async (userId: string, sessionId: string): Promise<UserGameSession | undefined> => {
  if (!isPostgresEnabled()) {
    return getInMemoryById(userId, sessionId);
  }
  const rows = await queryDb<GameSessionRow>(
    'SELECT * FROM game_sessions WHERE id = $1 AND user_id = $2 LIMIT 1',
    [sessionId, userId],
  );
  const session = rows[0] ? mapRow(rows[0]) : undefined;
  if (session) {
    storeInMemory(session);
  }
  return session;
};

export const listUserGameSessions = async (userId: string, limit = 10): Promise<UserGameSession[]> => {
  if (!isPostgresEnabled()) {
    return Array.from(sessionsById.values())
      .filter((session) => session.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, limit);
  }
  const rows = await queryDb<GameSessionRow>(
    'SELECT * FROM game_sessions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2',
    [userId, limit],
  );
  const sessions = rows.map(mapRow);
  sessions.forEach(storeInMemory);
  return sessions;
};

export const getUserActiveGameSession = async (userId: string): Promise<UserGameSession | undefined> => {
  if (!isPostgresEnabled()) {
    return Array.from(sessionsById.values())
      .filter((session) => session.userId === userId && session.status === 'in_progress')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  }
  const rows = await queryDb<GameSessionRow>(
    `SELECT *
    FROM game_sessions
    WHERE user_id = $1 AND game_status = 'in_progress'
    ORDER BY updated_at DESC
    LIMIT 1`,
    [userId],
  );
  const session = rows[0] ? mapRow(rows[0]) : undefined;
  if (session) {
    storeInMemory(session);
  }
  return session;
};

export const clearGamesStore = async (): Promise<void> => {
  sessionsById.clear();
  if (!isPostgresEnabled()) {
    return;
  }
  await queryDb('DELETE FROM game_sessions');
};
