export interface CellCoord {
  cell: number;
  xPercent: number;
  yPercent: number;
}

const FULL_COLUMNS = 9;
const FULL_ROWS = 8;

// Calibrated to the printed number centers on design/print/board-full-master.png.
const X_MIN = 5.1;
const X_MAX = 88.9;
const Y_TOP = 11.6;
const Y_BOTTOM = 88.4;

const rowY = (rowFromBottom: number): number => {
  const ratio = rowFromBottom / (FULL_ROWS - 1);
  return Number((Y_BOTTOM - ratio * (Y_BOTTOM - Y_TOP)).toFixed(2));
};

const colX = (column: number): number => {
  const ratio = column / (FULL_COLUMNS - 1);
  return Number((X_MIN + ratio * (X_MAX - X_MIN)).toFixed(2));
};

// Manual calibration fixes for the printed board artwork.
// Cells 2 and 3 labels are visually shifted compared to the ideal linear grid,
// so we pin them explicitly to their real centers to keep tap-hit mapping correct.
const FULL_BOARD_OVERRIDES: Partial<Record<number, { xPercent?: number; yPercent?: number }>> = {
  2: { xPercent: 26.05 },
  3: { xPercent: 15.58 },
};

export const FULL_BOARD_COORDS: CellCoord[] = Array.from({ length: 72 }, (_, index) => {
  const cell = index + 1;
  const rowFromBottom = Math.floor(index / FULL_COLUMNS);
  const indexInRow = index % FULL_COLUMNS;
  const isReverseRow = rowFromBottom % 2 === 1;
  const column = isReverseRow ? FULL_COLUMNS - 1 - indexInRow : indexInRow;
  const override = FULL_BOARD_OVERRIDES[cell];

  return {
    cell,
    xPercent: override?.xPercent ?? colX(column),
    yPercent: override?.yPercent ?? rowY(rowFromBottom),
  };
});
