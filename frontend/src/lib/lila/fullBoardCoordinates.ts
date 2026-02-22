export interface CellCoord {
  cell: number;
  xPercent: number;
  yPercent: number;
}

const FULL_COLUMNS = 9;
const FULL_ROWS = 8;

// Calibrated to the printed number centers on /field/НОВИЙ ДИЗАЙН.png.
const X_MIN = 8.0;
const X_MAX = 91.8;
const Y_TOP = 12.0;
const Y_BOTTOM = 88.1;

const rowY = (rowFromBottom: number): number => {
  const ratio = rowFromBottom / (FULL_ROWS - 1);
  return Number((Y_BOTTOM - ratio * (Y_BOTTOM - Y_TOP)).toFixed(2));
};

const colX = (column: number): number => {
  const ratio = column / (FULL_COLUMNS - 1);
  return Number((X_MIN + ratio * (X_MAX - X_MIN)).toFixed(2));
};

export const FULL_BOARD_COORDS: CellCoord[] = Array.from({ length: 72 }, (_, index) => {
  const cell = index + 1;
  const rowFromBottom = Math.floor(index / FULL_COLUMNS);
  const indexInRow = index % FULL_COLUMNS;
  const isReverseRow = rowFromBottom % 2 === 1;
  const column = isReverseRow ? FULL_COLUMNS - 1 - indexInRow : indexInRow;

  return {
    cell,
    xPercent: colX(column),
    yPercent: rowY(rowFromBottom),
  };
});
