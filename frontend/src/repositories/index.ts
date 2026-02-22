import { db, type LilaDexieDb } from '../db/dexie';
import { DexieInsightsRepository } from './dexie/DexieInsightsRepository';
import { DexieMovesRepository } from './dexie/DexieMovesRepository';
import { DexieSessionsRepository } from './dexie/DexieSessionsRepository';
import { DexieSettingsRepository } from './dexie/DexieSettingsRepository';

export interface RepositoryContainer {
  insightsRepository: DexieInsightsRepository;
  sessionsRepository: DexieSessionsRepository;
  movesRepository: DexieMovesRepository;
  settingsRepository: DexieSettingsRepository;
}

export const createRepositories = (dexie: LilaDexieDb = db): RepositoryContainer => ({
  insightsRepository: new DexieInsightsRepository(dexie),
  sessionsRepository: new DexieSessionsRepository(dexie),
  movesRepository: new DexieMovesRepository(dexie),
  settingsRepository: new DexieSettingsRepository(dexie),
});
