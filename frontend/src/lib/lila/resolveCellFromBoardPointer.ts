import type { BoardType } from '../../domain/types';
import { getBoardProfile } from './boardProfiles';

interface BoardPointerPoint {
  xPercent: number;
  yPercent: number;
}

const distance = (left: BoardPointerPoint, right: BoardPointerPoint): number =>
  Math.hypot(left.xPercent - right.xPercent, left.yPercent - right.yPercent);

const resolveByGridArea = (
  boardType: BoardType,
  point: BoardPointerPoint,
): number | undefined => {
  const profile = getBoardProfile(boardType);
  const grid = profile.hitTest;

  const xs = profile.cellCoordinates.map((coord) => coord.xPercent);
  const ys = profile.cellCoordinates.map((coord) => coord.yPercent);
  const xMin = grid.xMinPercent ?? Math.min(...xs);
  const xMax = grid.xMaxPercent ?? Math.max(...xs);
  const yTop = grid.yTopPercent ?? Math.min(...ys);
  const yBottom = grid.yBottomPercent ?? Math.max(...ys);
  const hasExplicitBounds =
    grid.xMinPercent !== undefined
    && grid.xMaxPercent !== undefined
    && grid.yTopPercent !== undefined
    && grid.yBottomPercent !== undefined;
  const xStep = hasExplicitBounds
    ? (xMax - xMin) / Math.max(1, grid.columns)
    : (xMax - xMin) / Math.max(1, grid.columns - 1);
  const yStep = hasExplicitBounds
    ? (yBottom - yTop) / Math.max(1, grid.rows)
    : (yBottom - yTop) / Math.max(1, grid.rows - 1);
  const leftBound = hasExplicitBounds ? xMin : xMin - xStep / 2;
  const rightBound = hasExplicitBounds ? xMax : xMax + xStep / 2;
  const topBound = hasExplicitBounds ? yTop : yTop - yStep / 2;
  const bottomBound = hasExplicitBounds ? yBottom : yBottom + yStep / 2;

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

  const rowOrder = grid.rowCellOrderFromBottom?.[rowFromBottom];
  if (rowOrder && rowOrder.length === grid.columns) {
    return rowOrder[colFromLeft];
  }

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
  if (gridCell) {
    return gridCell;
  }

  let closestCell: number | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const coord of profile.cellCoordinates) {
    const currentDistance = distance(point, coord);
    if (currentDistance < closestDistance) {
      closestDistance = currentDistance;
      closestCell = coord.cell;
    }
  }
  if (closestDistance > maxDistancePercent) {
    return undefined;
  }
  return closestCell;
};
