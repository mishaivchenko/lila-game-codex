import type { BoardDefinition } from '../../domain/types';

export const buildStepwiseCellPath = (fromCell: number, dice: number, maxCell: number): number[] => {
  if (dice <= 0) {
    return [fromCell];
  }

  const path = [fromCell];
  let cell = fromCell;
  let direction: 1 | -1 = 1;

  for (let step = 0; step < dice; step += 1) {
    if (direction === 1) {
      if (cell >= maxCell) {
        direction = -1;
        cell = Math.max(1, maxCell - 1);
      } else {
        cell += 1;
      }
    } else if (cell > 1) {
      cell -= 1;
    } else {
      direction = 1;
      cell += 1;
    }

    path.push(cell);
  }

  return path;
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

  const provisionalPath = buildStepwiseCellPath(fromCell, dice, board.maxCell);
  const provisional = provisionalPath[provisionalPath.length - 1] ?? fromCell;
  const source = type === 'snake' ? board.snakes : board.arrows;
  const match = source.find((entry) => entry.from === provisional && entry.to === toCell);
  return match?.from;
};
