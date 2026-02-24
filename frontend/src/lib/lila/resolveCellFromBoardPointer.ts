import type { BoardType } from '../../domain/types';
import { getBoardProfile } from './boardProfiles';

interface BoardPointerPoint {
  xPercent: number;
  yPercent: number;
}

const distance = (left: BoardPointerPoint, right: BoardPointerPoint): number =>
  Math.hypot(left.xPercent - right.xPercent, left.yPercent - right.yPercent);

export const resolveCellFromBoardPercent = (
  boardType: BoardType,
  point: BoardPointerPoint,
  maxDistancePercent = 6.5,
): number | undefined => {
  const profile = getBoardProfile(boardType);
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

