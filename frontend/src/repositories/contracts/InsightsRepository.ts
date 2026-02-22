import type { CellInsight } from '../../domain/types';

export interface InsightsRepository {
  saveInsight(insight: CellInsight): Promise<void>;
  getInsightsBySession(sessionId: string): Promise<CellInsight[]>;
  getInsightByCell(sessionId: string, cellNumber: number): Promise<CellInsight | undefined>;
}
