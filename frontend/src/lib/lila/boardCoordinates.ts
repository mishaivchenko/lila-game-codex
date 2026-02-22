const DEFAULT_COLUMNS = 6;
const DEFAULT_MAX_CELL = 72;

export interface CellPosition {
  x: number;
  y: number;
}

export const getCellPosition = (
  cellNumber: number,
  maxCell: number = DEFAULT_MAX_CELL,
  columns: number = DEFAULT_COLUMNS,
): CellPosition => {
  const safeCell = Math.max(1, Math.min(cellNumber, maxCell));
  const rowCount = Math.ceil(maxCell / columns);
  const index = safeCell - 1;
  const row = Math.floor(index / columns);
  const column = index % columns;

  return {
    x: ((column + 0.5) / columns) * 100,
    y: ((row + 0.5) / rowCount) * 100,
  };
};
