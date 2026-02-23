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

const buildSnakeFlowPoints = (
  from: CellCoord,
  to: CellCoord,
): BoardTransitionPath['points'] => {
  const dx = to.xPercent - from.xPercent;
  const dy = to.yPercent - from.yPercent;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;

  const amplitude = Math.min(7.6, Math.max(3.2, length * 0.12));
  const waves = Math.max(3, Math.min(7, Math.round(length / 16)));
  const steps = Math.max(10, waves * 4);
  const points: BoardTransitionPath['points'] = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const taper = 1 - Math.abs(0.5 - t) * 0.9;
    const offset = Math.sin(t * Math.PI * waves) * amplitude * taper;
    points.push({
      xPercent: normalize(from.xPercent + dx * t + px * offset),
      yPercent: normalize(from.yPercent + dy * t + py * offset),
    });
  }

  points[0] = { xPercent: from.xPercent, yPercent: from.yPercent };
  points[points.length - 1] = { xPercent: to.xPercent, yPercent: to.yPercent };
  return points;
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
    const points = type === 'snake'
      ? buildSnakeFlowPoints(from, to)
      : buildCurvedPoints(from, to, type);

    return {
      fromCell: transition.from,
      toCell: transition.to,
      points,
    };
  });
};
