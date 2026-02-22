import type { CellCoord } from './fullBoardCoordinates';

const SHORT_COLUMNS = 6;
const SHORT_ROWS = 6;
const X_MIN = 7.5;
const X_MAX = 92.8;
const Y_TOP = 12.4;
const Y_BOTTOM = 88.2;

const rowY = (rowFromBottom: number): number => {
  const ratio = rowFromBottom / (SHORT_ROWS - 1);
  return Y_BOTTOM - ratio * (Y_BOTTOM - Y_TOP);
};

const colX = (column: number): number => {
  const ratio = column / (SHORT_COLUMNS - 1);
  return X_MIN + ratio * (X_MAX - X_MIN);
};

export const SHORT_BOARD_COORDS: CellCoord[] = Array.from({ length: 36 }, (_, index) => {
  const cell = index + 1;
  const rowFromBottom = Math.floor(index / SHORT_COLUMNS);
  const indexInRow = index % SHORT_COLUMNS;
  const isReverseRow = rowFromBottom % 2 === 1;
  const column = isReverseRow ? SHORT_COLUMNS - 1 - indexInRow : indexInRow;

  return {
    cell,
    x: Number(colX(column).toFixed(2)),
    y: Number(rowY(rowFromBottom).toFixed(2)),
  };
});
