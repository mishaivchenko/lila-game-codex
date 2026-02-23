import type { GameMove } from '../../domain/types';

export type MoveType = 'normal' | 'snake' | 'ladder';

export const resolveMoveType = (move: Pick<GameMove, 'moveType' | 'snakeOrArrow'>): MoveType => {
  if (move.moveType) {
    return move.moveType;
  }
  if (move.snakeOrArrow === 'snake') {
    return 'snake';
  }
  if (move.snakeOrArrow === 'arrow') {
    return 'ladder';
  }
  return 'normal';
};

export const getMoveSymbol = (moveType: MoveType): string => {
  if (moveType === 'ladder') {
    return '⇧';
  }
  if (moveType === 'snake') {
    return '⇩';
  }
  return '→';
};

export const formatMovePath = (move: Pick<GameMove, 'fromCell' | 'toCell' | 'moveType' | 'snakeOrArrow'>): string => {
  const moveType = resolveMoveType(move);
  return `${move.fromCell} ${getMoveSymbol(moveType)} ${move.toCell}`;
};
