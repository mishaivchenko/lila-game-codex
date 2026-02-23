import { useMemo } from 'react';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { buildSmoothPath, sampleAngleByProgress, samplePathByProgress } from './pathAnimationMath';

interface AnimationRendererSnakeProps {
  points: BoardPathPoint[];
  progress: number;
  opacity: number;
}

export const AnimationRendererSnake = ({ points, progress, opacity }: AnimationRendererSnakeProps) => {
  const path = useMemo(() => buildSmoothPath(points), [points]);
  const head = useMemo(() => samplePathByProgress(points, progress), [points, progress]);
  const angle = useMemo(() => sampleAngleByProgress(points, progress), [points, progress]);

  const reveal = Math.max(0.0001, progress);
  const growth = 0.92 + progress * 0.16;

  return (
    <g
      transform={`translate(${head.xPercent} ${head.yPercent}) rotate(${angle}) scale(${growth}) translate(${-head.xPercent} ${-head.yPercent})`}
      style={{ opacity }}
      data-testid="lila-snake-renderer"
    >
      <path
        d={path}
        fill="none"
        stroke="rgba(209,138,67,0.32)"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reveal} 1`}
        data-testid="lila-snake-body-glow"
      />
      <path
        d={path}
        fill="none"
        stroke="#D18A43"
        strokeWidth={1.65}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reveal} 1`}
        data-testid="lila-snake-body"
      />
      <ellipse
        cx={head.xPercent}
        cy={head.yPercent}
        rx={1.48}
        ry={1.04}
        fill="#E8B06D"
        stroke="#A85F2A"
        strokeWidth={0.22}
        data-testid="lila-snake-head"
      />
      <circle cx={head.xPercent + 0.34} cy={head.yPercent - 0.16} r={0.15} fill="#2B2217" />
    </g>
  );
};
