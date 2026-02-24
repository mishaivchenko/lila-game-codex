import { db, type LilaDexieDb } from '../db/dexie';
import type { CellInsight, GameMove, GameSession, SettingsEntity } from '../domain/types';
import type { InsightsRepository } from './contracts/InsightsRepository';
import type { MovesRepository } from './contracts/MovesRepository';
import type { SessionsRepository } from './contracts/SessionsRepository';
import type { SettingsRepository } from './contracts/SettingsRepository';
import { DexieInsightsRepository } from './dexie/DexieInsightsRepository';
import { DexieMovesRepository } from './dexie/DexieMovesRepository';
import { DexieSessionsRepository } from './dexie/DexieSessionsRepository';
import { DexieSettingsRepository } from './dexie/DexieSettingsRepository';

export interface RepositoryContainer {
  insightsRepository: InsightsRepository;
  sessionsRepository: SessionsRepository;
  movesRepository: MovesRepository;
  settingsRepository: SettingsRepository;
}

type InMemoryStore = {
  sessions: Map<string, GameSession>;
  moves: GameMove[];
  insights: CellInsight[];
  settings: SettingsEntity;
};

const inMemoryStore: InMemoryStore = {
  sessions: new Map(),
  moves: [],
  insights: [],
  settings: {
    id: 'global',
    soundEnabled: true,
    musicEnabled: true,
    defaultSpeed: 'normal',
    defaultDepth: 'standard',
  },
};

class InMemoryInsightsRepository implements InsightsRepository {
  async saveInsight(insight: CellInsight): Promise<void> {
    inMemoryStore.insights.push(insight);
  }

  async getInsightsBySession(sessionId: string): Promise<CellInsight[]> {
    return inMemoryStore.insights
      .filter((insight) => insight.sessionId === sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getInsightByCell(sessionId: string, cellNumber: number): Promise<CellInsight | undefined> {
    return inMemoryStore.insights.find(
      (insight) => insight.sessionId === sessionId && insight.cellNumber === cellNumber,
    );
  }
}

class InMemorySessionsRepository implements SessionsRepository {
  async saveSession(session: GameSession): Promise<void> {
    inMemoryStore.sessions.set(session.id, session);
  }

  async updateSession(sessionId: string, patch: Partial<GameSession>): Promise<GameSession | undefined> {
    const session = inMemoryStore.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    const updatedSession: GameSession = {
      ...session,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    inMemoryStore.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getSession(sessionId: string): Promise<GameSession | undefined> {
    return inMemoryStore.sessions.get(sessionId);
  }

  async getLastActiveSession(): Promise<GameSession | undefined> {
    const sessions = [...inMemoryStore.sessions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return sessions.find((session) => !session.finished && session.sessionStatus !== 'completed');
  }
}

class InMemoryMovesRepository implements MovesRepository {
  async saveMove(move: GameMove): Promise<void> {
    inMemoryStore.moves.push(move);
  }

  async getMovesBySession(sessionId: string): Promise<GameMove[]> {
    return inMemoryStore.moves
      .filter((move) => move.sessionId === sessionId)
      .sort((a, b) => a.moveNumber - b.moveNumber);
  }

  async getNextMoveNumber(sessionId: string): Promise<number> {
    const moves = inMemoryStore.moves
      .filter((move) => move.sessionId === sessionId)
      .sort((a, b) => b.moveNumber - a.moveNumber);
    return (moves[0]?.moveNumber ?? 0) + 1;
  }
}

class InMemorySettingsRepository implements SettingsRepository {
  async getSettings(): Promise<SettingsEntity> {
    return inMemoryStore.settings;
  }

  async saveSettings(settings: SettingsEntity): Promise<void> {
    inMemoryStore.settings = settings;
  }
}

const createInMemoryRepositories = (): RepositoryContainer => ({
  insightsRepository: new InMemoryInsightsRepository(),
  sessionsRepository: new InMemorySessionsRepository(),
  movesRepository: new InMemoryMovesRepository(),
  settingsRepository: new InMemorySettingsRepository(),
});

export const createRepositories = (dexie?: LilaDexieDb): RepositoryContainer => {
  const storage = dexie ?? db;

  if (!storage) {
    return createInMemoryRepositories();
  }

  return {
    insightsRepository: new DexieInsightsRepository(storage),
    sessionsRepository: new DexieSessionsRepository(storage),
    movesRepository: new DexieMovesRepository(storage),
    settingsRepository: new DexieSettingsRepository(storage),
  };
};
