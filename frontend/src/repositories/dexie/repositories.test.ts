import { afterEach, describe, expect, it } from 'vitest';
import { LilaDexieDb } from '../../db/dexie';
import { DexieInsightsRepository } from './DexieInsightsRepository';
import { DexieSessionsRepository } from './DexieSessionsRepository';

let db: LilaDexieDb;

afterEach(async () => {
  if (db) {
    await db.delete();
  }
});

describe('dexie repositories', () => {
  it('saves and resumes session', async () => {
    db = new LilaDexieDb(`test_${Date.now()}`);
    const sessions = new DexieSessionsRepository(db);

    await sessions.saveSession({
      id: 'session-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boardType: 'full',
      currentCell: 1,
      settings: { speed: 'normal', depth: 'standard' },
      request: { isDeepEntry: false, simpleRequest: 'test' },
      sessionStatus: 'active',
      finished: false,
      hasEnteredGame: false,
    });

    const active = await sessions.getLastActiveSession();
    expect(active?.id).toBe('session-1');
  });

  it('saves and reads insights', async () => {
    db = new LilaDexieDb(`test_${Date.now()}`);
    const insights = new DexieInsightsRepository(db);

    await insights.saveInsight({
      id: 'insight-1',
      sessionId: 'session-1',
      cellNumber: 4,
      text: 'note',
      createdAt: new Date().toISOString(),
    });

    const insight = await insights.getInsightByCell('session-1', 4);
    expect(insight?.text).toBe('note');
  });
});
