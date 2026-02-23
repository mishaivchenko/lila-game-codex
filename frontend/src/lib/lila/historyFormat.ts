import type { GameMove } from '../../domain/types';

export type MoveType = 'normal' | 'snake' | 'ladder';

export interface MovePresentation {
  symbol: string;
  label: string;
  badgeClassName: string;
  rowClassName: string;
}

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

export const getMovePresentation = (moveType: MoveType): MovePresentation => {
  if (moveType === 'ladder') {
    return {
      symbol: '⇧',
      label: 'Стріла',
      badgeClassName: 'bg-teal-100 text-teal-800',
      rowClassName: 'border border-teal-200 bg-teal-50/40',
    };
  }

  if (moveType === 'snake') {
    return {
      symbol: '⇩',
      label: 'Змія',
      badgeClassName: 'bg-amber-100 text-amber-800',
      rowClassName: 'border border-amber-200 bg-amber-50/40',
    };
  }

  return {
    symbol: '→',
    label: 'Хід',
    badgeClassName: 'bg-stone-100 text-stone-700',
    rowClassName: 'border border-stone-200 bg-white',
  };
};

export const formatMovePath = (move: Pick<GameMove, 'fromCell' | 'toCell' | 'moveType' | 'snakeOrArrow'>): string => {
  const moveType = resolveMoveType(move);
  return `${move.fromCell} ${getMoveSymbol(moveType)} ${move.toCell}`;
};
