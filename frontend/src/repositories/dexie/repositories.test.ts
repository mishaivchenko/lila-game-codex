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

    const firstText = 'Це моя думка про цю клітину.\nЯ відчуваю спокій 🙂';
    await insights.saveInsight({
      id: 'insight-1',
      sessionId: 'session-1',
      cellNumber: 4,
      text: firstText,
      createdAt: new Date().toISOString(),
    });

    const firstInsight = await insights.getInsightByCell('session-1', 4);
    expect(firstInsight?.text).toBe(firstText);

    const updatedText = 'Это мой обновлённый текст.\nLine 2 in English 🚀';
    await insights.saveInsight({
      id: 'insight-2',
      sessionId: 'session-1',
      cellNumber: 4,
      text: updatedText,
      createdAt: new Date(Date.now() + 1000).toISOString(),
    });

    const insight = await insights.getInsightByCell('session-1', 4);
    const all = await insights.getInsightsBySession('session-1');

    expect(insight?.text).toBe(updatedText);
    expect(all).toHaveLength(1);
    expect(all[0]?.text).toBe(updatedText);
  });
});
