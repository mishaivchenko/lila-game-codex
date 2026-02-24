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
      <path
        d={path}
        fill="none"
        stroke="rgba(209,138,67,0.36)"
        strokeWidth={3}
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
        stroke="#D18A43"
        strokeWidth={1.8}
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
          x={-4.2}
          y={-3.2}
          width={8.4}
          height={6.4}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.36 + progress * 0.44}
        />
        <ellipse
          cx="0"
          cy="0"
          rx={1.58}
          ry={1.08}
          fill="#E8B06D"
          stroke="#A85F2A"
          strokeWidth={0.22}
        />
        <circle cx="0.42" cy="-0.14" r={0.16} fill="#2B2217" />
      </g>
    </g>
  );
};
