import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export interface PathMetrics {
  cumulative: number[];
  totalLength: number;
}

export const getPathMetrics = (points: BoardPathPoint[]): PathMetrics => {
  if (points.length <= 1) {
    return { cumulative: [0], totalLength: 0 };
  }

  const cumulative: number[] = [0];
  for (let i = 0; i < points.length - 1; i += 1) {
    const dx = points[i + 1].xPercent - points[i].xPercent;
    const dy = points[i + 1].yPercent - points[i].yPercent;
    cumulative.push(cumulative[i] + Math.hypot(dx, dy));
  }

  return {
    cumulative,
    totalLength: cumulative[cumulative.length - 1] ?? 0,
  };
};

const interpolateSegment = (
  a: BoardPathPoint,
  b: BoardPathPoint,
  t: number,
): BoardPathPoint => ({
  xPercent: a.xPercent + (b.xPercent - a.xPercent) * t,
  yPercent: a.yPercent + (b.yPercent - a.yPercent) * t,
});

export const samplePathByProgress = (
  points: BoardPathPoint[],
  progress: number,
): BoardPathPoint => {
  if (points.length === 0) {
    return { xPercent: 50, yPercent: 50 };
  }
  if (points.length === 1) {
    return points[0];
  }

  const { cumulative, totalLength } = getPathMetrics(points);
  if (totalLength === 0) {
    return points[points.length - 1];
  }

  const clamped = clamp01(progress);
  const target = totalLength * clamped;

  for (let i = 0; i < cumulative.length - 1; i += 1) {
    const start = cumulative[i];
    const end = cumulative[i + 1];
    if (target <= end) {
      const len = end - start;
      const t = len === 0 ? 1 : (target - start) / len;
      return interpolateSegment(points[i], points[i + 1], t);
    }
  }

  return points[points.length - 1];
};

export const sampleAngleByProgress = (
  points: BoardPathPoint[],
  progress: number,
  lookAhead = 0.025,
): number => {
  const a = samplePathByProgress(points, progress);
  const b = samplePathByProgress(points, Math.min(1, progress + lookAhead));
  return Math.atan2(b.yPercent - a.yPercent, b.xPercent - a.xPercent) * (180 / Math.PI);
};

export const buildSmoothPath = (points: BoardPathPoint[]): string => {
  if (points.length < 2) {
    return '';
  }
  if (points.length === 2) {
    return `M ${points[0].xPercent} ${points[0].yPercent} L ${points[1].xPercent} ${points[1].yPercent}`;
  }

  let d = `M ${points[0].xPercent} ${points[0].yPercent}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.xPercent + next.xPercent) / 2;
    const midY = (current.yPercent + next.yPercent) / 2;
    d += ` Q ${current.xPercent} ${current.yPercent}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.xPercent} ${last.yPercent}`;
  return d;
};

export const buildPolylinePath = (points: BoardPathPoint[]): string => {
  if (points.length < 2) {
    return '';
  }
  let d = `M ${points[0].xPercent} ${points[0].yPercent}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].xPercent} ${points[i].yPercent}`;
  }
  return d;
};

export const buildOrthogonalStepPoints = (points: BoardPathPoint[]): BoardPathPoint[] => {
  if (points.length <= 1) {
    return points;
  }

  const orthogonal: BoardPathPoint[] = [points[0]];
  let horizontalFirst = true;

  for (let i = 1; i < points.length; i += 1) {
    const prev = orthogonal[orthogonal.length - 1] ?? points[i - 1];
    const next = points[i];
    const dx = next.xPercent - prev.xPercent;
    const dy = next.yPercent - prev.yPercent;

    if (Math.abs(dx) < 0.01 || Math.abs(dy) < 0.01) {
      orthogonal.push(next);
      continue;
    }

    const corner = horizontalFirst
      ? { xPercent: next.xPercent, yPercent: prev.yPercent }
      : { xPercent: prev.xPercent, yPercent: next.yPercent };
    horizontalFirst = !horizontalFirst;

    orthogonal.push(corner, next);
  }

  return orthogonal;
};

export const buildStepSamples = (
  points: BoardPathPoint[],
  spacing = 4.8,
): Array<{ point: BoardPathPoint; angle: number }> => {
  const { totalLength } = getPathMetrics(points);
  if (totalLength === 0) {
    return [];
  }

  const count = Math.max(4, Math.floor(totalLength / spacing));
  return Array.from({ length: count }, (_, index) => {
    const progress = (index + 1) / (count + 1);
    return {
      point: samplePathByProgress(points, progress),
      angle: sampleAngleByProgress(points, progress),
    };
  });
};
