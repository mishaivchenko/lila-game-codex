import type { BoardDefinition } from '../../domain/types';

const applyBounce = (fromCell: number, dice: number, maxCell: number): number => {
  const target = fromCell + dice;
  if (target <= maxCell) {
    return target;
  }
  const overshoot = target - maxCell;
  return maxCell - overshoot;
};

export const resolveTransitionEntryCell = (
  fromCell: number,
  dice: number,
  board: BoardDefinition,
  type: 'snake' | 'arrow' | null | undefined,
  toCell: number,
): number | undefined => {
  if (!type) {
    return undefined;
  }

  const provisional = applyBounce(fromCell, dice, board.maxCell);
  const source = type === 'snake' ? board.snakes : board.arrows;
  const match = source.find((entry) => entry.from === provisional && entry.to === toCell);
  return match?.from;
};
