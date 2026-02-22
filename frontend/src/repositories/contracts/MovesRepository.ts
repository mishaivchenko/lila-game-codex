import type { GameMove } from '../../domain/types';

export interface MovesRepository {
  saveMove(move: GameMove): Promise<void>;
  getMovesBySession(sessionId: string): Promise<GameMove[]>;
  getNextMoveNumber(sessionId: string): Promise<number>;
}
