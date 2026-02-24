import type { LilaDexieDb } from '../../db/dexie';
import type { CellInsight } from '../../domain/types';
import type { InsightsRepository } from '../contracts/InsightsRepository';

export class DexieInsightsRepository implements InsightsRepository {
  constructor(private readonly dexie: LilaDexieDb) {}

  async saveInsight(insight: CellInsight): Promise<void> {
    await this.dexie.transaction('rw', this.dexie.insights, async () => {
      const sameCell = await this.dexie.insights
        .where('[sessionId+cellNumber]')
        .equals([insight.sessionId, insight.cellNumber])
        .toArray();

      if (sameCell.length === 0) {
        await this.dexie.insights.put(insight);
        return;
      }

      const latestExisting = sameCell.sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
      const obsoleteIds = sameCell.filter((entry) => entry.id !== latestExisting.id).map((entry) => entry.id);
      if (obsoleteIds.length > 0) {
        await this.dexie.insights.bulkDelete(obsoleteIds);
      }

      await this.dexie.insights.put({
        ...latestExisting,
        ...insight,
        id: latestExisting.id,
      });
    });
  }

  async getInsightsBySession(sessionId: string): Promise<CellInsight[]> {
    return this.dexie.insights.where('sessionId').equals(sessionId).sortBy('createdAt');
  }

  async getInsightByCell(sessionId: string, cellNumber: number): Promise<CellInsight | undefined> {
    return this.dexie.insights.where({ sessionId, cellNumber }).first();
  }
}
