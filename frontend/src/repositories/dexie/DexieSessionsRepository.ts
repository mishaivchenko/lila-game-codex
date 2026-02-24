import type { LilaDexieDb } from '../../db/dexie';
import type { GameSession } from '../../domain/types';
import type { SessionsRepository } from '../contracts/SessionsRepository';

export class DexieSessionsRepository implements SessionsRepository {
  constructor(private readonly dexie: LilaDexieDb) {}

  async saveSession(session: GameSession): Promise<void> {
    await this.dexie.sessions.put(session);
  }

  async updateSession(sessionId: string, patch: Partial<GameSession>): Promise<GameSession | undefined> {
    const existing = await this.dexie.sessions.get(sessionId);
    if (!existing) {
      return undefined;
    }

    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    await this.dexie.sessions.put(updated);
    return updated;
  }

  async getSession(sessionId: string): Promise<GameSession | undefined> {
    return this.dexie.sessions.get(sessionId);
  }

  async getLastActiveSession(): Promise<GameSession | undefined> {
    const sessions = await this.dexie.sessions.orderBy('updatedAt').reverse().toArray();
    return sessions.find((session) => !session.finished && session.sessionStatus !== 'completed');
  }
}
