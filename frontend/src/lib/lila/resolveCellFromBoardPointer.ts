import type { BoardType } from '../../domain/types';
import { getBoardProfile } from './boardProfiles';

interface BoardPointerPoint {
  xPercent: number;
  yPercent: number;
}

const distance = (left: BoardPointerPoint, right: BoardPointerPoint): number =>
  Math.hypot(left.xPercent - right.xPercent, left.yPercent - right.yPercent);

const BOARD_GRID: Record<BoardType, { columns: number; rows: number }> = {
  full: { columns: 9, rows: 8 },
  short: { columns: 6, rows: 6 },
};

const resolveByGridArea = (
  boardType: BoardType,
  point: BoardPointerPoint,
): number | undefined => {
  const profile = getBoardProfile(boardType);
  const grid = BOARD_GRID[boardType];

  const xs = profile.cellCoordinates.map((coord) => coord.xPercent);
  const ys = profile.cellCoordinates.map((coord) => coord.yPercent);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yTop = Math.min(...ys);
  const yBottom = Math.max(...ys);
  const xStep = (xMax - xMin) / Math.max(1, grid.columns - 1);
  const yStep = (yBottom - yTop) / Math.max(1, grid.rows - 1);
  const leftBound = xMin - xStep / 2;
  const rightBound = xMax + xStep / 2;
  const topBound = yTop - yStep / 2;
  const bottomBound = yBottom + yStep / 2;

  if (
    point.xPercent < leftBound
    || point.xPercent > rightBound
    || point.yPercent < topBound
    || point.yPercent > bottomBound
  ) {
    return undefined;
  }

  const colFromLeft = Math.max(
    0,
    Math.min(
      grid.columns - 1,
      Math.floor((point.xPercent - leftBound) / xStep),
    ),
  );
  const rowFromBottom = Math.max(
    0,
    Math.min(
      grid.rows - 1,
      Math.floor((bottomBound - point.yPercent) / yStep),
    ),
  );
  const isReverseRow = rowFromBottom % 2 === 1;
  const indexInRow = isReverseRow ? grid.columns - 1 - colFromLeft : colFromLeft;

  return rowFromBottom * grid.columns + indexInRow + 1;
};

export const resolveCellFromBoardPercent = (
  boardType: BoardType,
  point: BoardPointerPoint,
  maxDistancePercent = 6.5,
): number | undefined => {
  const profile = getBoardProfile(boardType);
  const gridCell = resolveByGridArea(boardType, point);
  let closestCell: number | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const coord of profile.cellCoordinates) {
    const currentDistance = distance(point, coord);
    if (currentDistance < closestDistance) {
      closestDistance = currentDistance;
      closestCell = coord.cell;
    }
  }

  // Prefer nearest calibrated cell center when it is close enough.
  // This avoids local mis-mapping on visually dense areas where a coarse grid
  // bucket can disagree with the actual calibrated board coordinates.
  if (closestDistance <= maxDistancePercent && closestCell) {
    return closestCell;
  }

  if (gridCell) {
    return gridCell;
  }

  return undefined;
};
