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

  const coordsByCell = new Map(profile.cellCoordinates.map((coord) => [coord.cell, coord]));
  const xCentersByColumn = Array.from({ length: grid.columns }, () => [] as number[]);
  const yCentersByRow = Array.from({ length: grid.rows }, () => [] as number[]);

  for (let rowFromBottom = 0; rowFromBottom < grid.rows; rowFromBottom += 1) {
    const rowOrder = grid.rowCellOrderFromBottom?.[rowFromBottom];
    for (let colFromLeft = 0; colFromLeft < grid.columns; colFromLeft += 1) {
      const defaultCell = rowFromBottom * grid.columns + (rowFromBottom % 2 === 1 ? grid.columns - colFromLeft : colFromLeft + 1);
      const cell =
        rowOrder && rowOrder.length === grid.columns
          ? rowOrder[colFromLeft]
          : defaultCell;
      const coord = coordsByCell.get(cell);
      if (!coord) {
        continue;
      }
      xCentersByColumn[colFromLeft]?.push(coord.xPercent);
      yCentersByRow[rowFromBottom]?.push(coord.yPercent);
    }
  }

  const xCenters = xCentersByColumn.map((values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
  const yCenters = yCentersByRow.map((values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));

  if (xCenters.some((value) => Number.isNaN(value)) || yCenters.some((value) => Number.isNaN(value))) {
    return undefined;
  }

  const xBounds = new Array<number>(grid.columns + 1);
  xBounds[0] = xCenters[0] - (xCenters[1] - xCenters[0]) / 2;
  for (let index = 1; index < xCenters.length; index += 1) {
    xBounds[index] = (xCenters[index - 1] + xCenters[index]) / 2;
  }
  xBounds[grid.columns] = xCenters[grid.columns - 1] + (xCenters[grid.columns - 1] - xCenters[grid.columns - 2]) / 2;

  const yBounds = new Array<number>(grid.rows + 1);
  yBounds[0] = yCenters[0] + (yCenters[0] - yCenters[1]) / 2;
  for (let index = 1; index < yCenters.length; index += 1) {
    yBounds[index] = (yCenters[index - 1] + yCenters[index]) / 2;
  }
  yBounds[grid.rows] = yCenters[grid.rows - 1] - (yCenters[grid.rows - 2] - yCenters[grid.rows - 1]) / 2;

  if (
    point.xPercent < xBounds[0]
    || point.xPercent > xBounds[grid.columns]
    || point.yPercent > yBounds[0]
    || point.yPercent < yBounds[grid.rows]
  ) {
    return undefined;
  }

  let colFromLeft = -1;
  for (let column = 0; column < grid.columns; column += 1) {
    if (point.xPercent >= xBounds[column] && point.xPercent <= xBounds[column + 1]) {
      colFromLeft = column;
      break;
    }
  }

  let rowFromBottom = -1;
  for (let row = 0; row < grid.rows; row += 1) {
    if (point.yPercent <= yBounds[row] && point.yPercent >= yBounds[row + 1]) {
      rowFromBottom = row;
      break;
    }
  }

  if (colFromLeft < 0 || rowFromBottom < 0) {
    return undefined;
  }

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
