import type { LilaDexieDb } from '../../db/dexie';
import type { CellInsight } from '../../domain/types';
import type { InsightsRepository } from '../contracts/InsightsRepository';

export class DexieInsightsRepository implements InsightsRepository {
  constructor(private readonly dexie: LilaDexieDb) {}

  async saveInsight(insight: CellInsight): Promise<void> {
    await this.dexie.insights.put(insight);
  }

  async getInsightsBySession(sessionId: string): Promise<CellInsight[]> {
    return this.dexie.insights.where('sessionId').equals(sessionId).sortBy('createdAt');
  }

  async getInsightByCell(sessionId: string, cellNumber: number): Promise<CellInsight | undefined> {
    return this.dexie.insights.where({ sessionId, cellNumber }).first();
  }
}
