import type { BoardDefinition, ComputedMove, DiceMode } from './types';

const BOARD_COLUMNS = 9;
const DEFAULT_FINISH_CELL = 68;

export const rollDice = (rng: () => number = Math.random): number => {
  const value = Math.floor(rng() * 6) + 1;
  return Math.max(1, Math.min(6, value));
};

export interface DiceRollResult {
  dice: number[];
  total: number;
}

export const rollDiceByMode = (
  diceMode: DiceMode,
  rng: () => number = Math.random,
): DiceRollResult => {
  const count = diceMode === 'fast' ? 2 : diceMode === 'triple' ? 3 : 1;
  const dice = Array.from({ length: count }, () => rollDice(rng));
  return {
    dice,
    total: dice.reduce((sum, value) => sum + value, 0),
  };
};

const resolveFinishCell = (board: BoardDefinition): number =>
  Math.min(DEFAULT_FINISH_CELL, board.maxCell);

const resolveRowStart = (cell: number): number =>
  Math.floor((cell - 1) / BOARD_COLUMNS) * BOARD_COLUMNS + 1;

const isCellInRange = (cell: number, from: number, to: number): boolean =>
  cell >= from && cell <= to;

export const resolveEffectiveDiceMode = (
  diceMode: DiceMode,
  currentCell: number,
  board: BoardDefinition,
): DiceMode => {
  if (diceMode !== 'fast') {
    return diceMode;
  }

  const finishCell = resolveFinishCell(board);
  const finalRowStart = resolveRowStart(finishCell);
  const finalTwoRowsStart = Math.max(1, finalRowStart - BOARD_COLUMNS);

  return isCellInRange(currentCell, finalTwoRowsStart, board.maxCell) ? 'classic' : 'fast';
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
  diceMode: DiceMode,
  hasEnteredGame: boolean,
): ComputedMove => {
  const provisionalCell = applyBounce(currentCell, dice, board.maxCell);
  const transformed = applySnakeOrArrow(provisionalCell, board);
  const finishCell = resolveFinishCell(board);
  const finalRowStart = resolveRowStart(finishCell);
  const reachedFinalRow = isCellInRange(transformed.finalCell, finalRowStart, board.maxCell);
  const finished = diceMode === 'triple'
    ? reachedFinalRow
    : transformed.finalCell === finishCell;

  return {
    fromCell: currentCell,
    toCell: transformed.finalCell,
    dice,
    snakeOrArrow: transformed.snakeOrArrow,
    finished,
    hasEnteredGame: hasEnteredGame || currentCell > 1 || transformed.finalCell > 1,
  };
};
