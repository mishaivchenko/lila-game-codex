import Dexie, { type Table } from 'dexie';
import type { CellInsight, GameMove, GameSession, SettingsEntity } from '../domain/types';

export class LilaDexieDb extends Dexie {
  sessions!: Table<GameSession, string>;
  moves!: Table<GameMove, string>;
  insights!: Table<CellInsight, string>;
  settings!: Table<SettingsEntity, string>;

  constructor(name = 'lila_game_db') {
    super(name);
    this.version(1).stores({
      sessions: 'id, updatedAt, finished, boardType',
      moves: 'id, sessionId, moveNumber, createdAt',
      insights: 'id, sessionId, cellNumber, [sessionId+cellNumber], createdAt',
      settings: 'id',
    });
  }
}

export const db = new LilaDexieDb();
