import { useMemo } from 'react';
import { getLilaVisualAssets } from '../../config/visualThemes';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { buildSmoothPath, sampleAngleByProgress, samplePathByProgress } from './pathAnimationMath';

interface AnimationRendererSnakeProps {
  points: BoardPathPoint[];
  progress: number;
  opacity: number;
}

export const AnimationRendererSnake = ({ points, progress, opacity }: AnimationRendererSnakeProps) => {
  const snakeSpirit = useMemo(() => getLilaVisualAssets().snakeSpirit, []);
  const path = useMemo(() => buildSmoothPath(points), [points]);
  const head = useMemo(() => samplePathByProgress(points, progress), [points, progress]);
  const angle = useMemo(() => sampleAngleByProgress(points, progress), [points, progress]);

  const reveal = Math.max(0.0001, progress);
  const headScale = 0.92 + progress * 0.2;
  const bodyWaveOffset = (1 - progress) * 0.42;

  return (
    <g style={{ opacity }} data-testid="lila-snake-renderer">
      <defs>
        <linearGradient id="snakeMinimalCore" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D9E3EC" />
          <stop offset="58%" stopColor="#9FB7C8" />
          <stop offset="100%" stopColor="#79D8F2" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="rgba(161,190,210,0.34)"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reveal} ${Math.max(0.0001, 1 - reveal)}`}
        strokeDashoffset={bodyWaveOffset}
        data-testid="lila-snake-body-glow"
      />
      <path
        d={path}
        fill="none"
        stroke="url(#snakeMinimalCore)"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reveal} ${Math.max(0.0001, 1 - reveal)}`}
        strokeDashoffset={bodyWaveOffset * 0.66}
        data-testid="lila-snake-body"
      />
      <g
        transform={`translate(${head.xPercent} ${head.yPercent}) rotate(${angle}) scale(${headScale})`}
        data-testid="lila-snake-head"
      >
        <image
          href={snakeSpirit}
          x={-6}
          y={-4.8}
          width={12}
          height={9.6}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.46 + progress * 0.34}
        />
        <ellipse
          cx="0"
          cy="0"
          rx={1.58}
          ry={1.08}
          fill="#E3EDF4"
          stroke="#6E8697"
          strokeWidth={0.22}
        />
        <circle cx="0.42" cy="-0.14" r={0.16} fill="#2B3F4E" />
      </g>
    </g>
  );
};
