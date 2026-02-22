import type { LilaDexieDb } from '../../db/dexie';
import type { GameMove } from '../../domain/types';
import type { MovesRepository } from '../contracts/MovesRepository';

export class DexieMovesRepository implements MovesRepository {
  constructor(private readonly dexie: LilaDexieDb) {}

  async saveMove(move: GameMove): Promise<void> {
    await this.dexie.moves.put(move);
  }

  async getMovesBySession(sessionId: string): Promise<GameMove[]> {
    return this.dexie.moves.where('sessionId').equals(sessionId).sortBy('moveNumber');
  }

  async getNextMoveNumber(sessionId: string): Promise<number> {
    const lastMove = await this.dexie.moves.where('sessionId').equals(sessionId).last();
    return (lastMove?.moveNumber ?? 0) + 1;
  }
}
