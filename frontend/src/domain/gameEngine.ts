import type { BoardDefinition, ComputedMove } from './types';

export const rollDice = (rng: () => number = Math.random): number => {
  const value = Math.floor(rng() * 6) + 1;
  return Math.max(1, Math.min(6, value));
};

const applyBounce = (fromCell: number, dice: number, maxCell: number): number => {
  const target = fromCell + dice;
  if (target <= maxCell) {
    return target;
  }
  const overshoot = target - maxCell;
  return maxCell - overshoot;
};

const applySnakeOrArrow = (
  cell: number,
  board: BoardDefinition,
): { finalCell: number; snakeOrArrow: 'snake' | 'arrow' | null } => {
  const arrow = board.arrows.find((entry) => entry.from === cell);
  if (arrow) {
    return { finalCell: arrow.to, snakeOrArrow: 'arrow' };
  }

  const snake = board.snakes.find((entry) => entry.from === cell);
  if (snake) {
    return { finalCell: snake.to, snakeOrArrow: 'snake' };
  }

  return { finalCell: cell, snakeOrArrow: null };
};

export const computeNextPosition = (
  currentCell: number,
  dice: number,
  board: BoardDefinition,
  hasEnteredGame: boolean,
): ComputedMove => {
  const provisionalCell = applyBounce(currentCell, dice, board.maxCell);
  const transformed = applySnakeOrArrow(provisionalCell, board);

  return {
    fromCell: currentCell,
    toCell: transformed.finalCell,
    dice,
    snakeOrArrow: transformed.snakeOrArrow,
    finished: transformed.finalCell === 68,
    hasEnteredGame: hasEnteredGame || currentCell > 1 || transformed.finalCell > 1,
  };
};
