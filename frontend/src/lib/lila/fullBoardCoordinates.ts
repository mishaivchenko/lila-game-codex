export interface CellCoord {
  cell: number;
  x: number;
  y: number;
}

const FULL_COLUMNS = 6;
const FULL_ROWS = 12;
const X_MIN = 6.2;
const X_MAX = 93.5;
const Y_TOP = 8.5;
const Y_BOTTOM = 92.2;

const rowY = (rowFromBottom: number): number => {
  const ratio = rowFromBottom / (FULL_ROWS - 1);
  return Y_BOTTOM - ratio * (Y_BOTTOM - Y_TOP);
};

const colX = (column: number): number => {
  const ratio = column / (FULL_COLUMNS - 1);
  return X_MIN + ratio * (X_MAX - X_MIN);
};

export const FULL_BOARD_COORDS: CellCoord[] = Array.from({ length: 72 }, (_, index) => {
  const cell = index + 1;
  const rowFromBottom = Math.floor(index / FULL_COLUMNS);
  const indexInRow = index % FULL_COLUMNS;
  const isReverseRow = rowFromBottom % 2 === 1;
  const column = isReverseRow ? FULL_COLUMNS - 1 - indexInRow : indexInRow;

  return {
    cell,
    x: Number(colX(column).toFixed(2)),
    y: Number(rowY(rowFromBottom).toFixed(2)),
  };
});
