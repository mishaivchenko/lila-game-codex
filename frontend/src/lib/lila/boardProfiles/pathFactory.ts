import type { CellCoord } from '../fullBoardCoordinates';
import type { BoardTransitionPath } from './types';

const toKey = (cell: number): number => cell;

const normalize = (value: number): number => Number(value.toFixed(2));

const getCoord = (index: Map<number, CellCoord>, cell: number): CellCoord => {
  const coord = index.get(toKey(cell));
  if (!coord) {
    throw new Error(`Missing coordinate for cell ${cell}`);
  }
  return coord;
};

const buildCurvedPoints = (
  from: CellCoord,
  to: CellCoord,
  type: 'snake' | 'ladder',
): BoardTransitionPath['points'] => {
  const dx = to.xPercent - from.xPercent;
  const dy = to.yPercent - from.yPercent;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const bend = type === 'snake' ? 4.2 : 2.4;
  const direction = dx >= 0 ? 1 : -1;

  const p1 = {
    xPercent: normalize(from.xPercent + dx * 0.33 + px * bend * direction),
    yPercent: normalize(from.yPercent + dy * 0.33 + py * bend * direction),
  };
  const p2 = {
    xPercent: normalize(from.xPercent + dx * 0.66 - px * bend * direction),
    yPercent: normalize(from.yPercent + dy * 0.66 - py * bend * direction),
  };

  return [
    { xPercent: from.xPercent, yPercent: from.yPercent },
    p1,
    p2,
    { xPercent: to.xPercent, yPercent: to.yPercent },
  ];
};

export const createTransitionPaths = (
  coordinates: CellCoord[],
  transitions: Array<{ from: number; to: number }>,
  type: 'snake' | 'ladder',
): BoardTransitionPath[] => {
  const index = new Map<number, CellCoord>(coordinates.map((coord) => [toKey(coord.cell), coord]));
  return transitions.map((transition) => {
    const from = getCoord(index, transition.from);
    const to = getCoord(index, transition.to);

    return {
      fromCell: transition.from,
      toCell: transition.to,
      points: buildCurvedPoints(from, to, type),
    };
  });
};
