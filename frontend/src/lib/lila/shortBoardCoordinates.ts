import type { CellCoord } from './fullBoardCoordinates';

const SHORT_COLUMNS = 6;
const SHORT_ROWS = 6;

// Calibrated to design/print/board-short-master.jpg and web short-board variants.
const X_MIN = 11.0;
const X_MAX = 89.0;
const Y_TOP = 13.0;
const Y_BOTTOM = 87.0;

const rowY = (rowFromBottom: number): number => {
  const ratio = rowFromBottom / (SHORT_ROWS - 1);
  return Number((Y_BOTTOM - ratio * (Y_BOTTOM - Y_TOP)).toFixed(2));
};

const colX = (column: number): number => {
  const ratio = column / (SHORT_COLUMNS - 1);
  return Number((X_MIN + ratio * (X_MAX - X_MIN)).toFixed(2));
};

export const SHORT_BOARD_COORDS: CellCoord[] = Array.from({ length: 36 }, (_, index) => {
  const cell = index + 1;
  const rowFromBottom = Math.floor(index / SHORT_COLUMNS);
  const indexInRow = index % SHORT_COLUMNS;
  const isReverseRow = rowFromBottom % 2 === 1;
  const column = isReverseRow ? SHORT_COLUMNS - 1 - indexInRow : indexInRow;

  return {
    cell,
    xPercent: colX(column),
    yPercent: rowY(rowFromBottom),
  };
});
