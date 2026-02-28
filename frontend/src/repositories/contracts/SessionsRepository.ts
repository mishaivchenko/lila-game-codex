import type { GameSession } from '../../domain/types';

export interface SessionsRepository {
  saveSession(session: GameSession): Promise<void>;
  updateSession(sessionId: string, patch: Partial<GameSession>): Promise<GameSession | undefined>;
  getSession(sessionId: string): Promise<GameSession | undefined>;
  getLastActiveSession(): Promise<GameSession | undefined>;
  listSessions(limit?: number, offset?: number): Promise<GameSession[]>;
}
