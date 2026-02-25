import { useId, useMemo } from 'react';
import { getLilaVisualAssets } from '../../config/visualThemes';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { buildSmoothPath, sampleAngleByProgress, samplePathByProgress } from './pathAnimationMath';
import { useBoardTheme } from '../../theme';

interface AnimationRendererSnakeProps {
  points: BoardPathPoint[];
  progress: number;
  opacity: number;
}

export const AnimationRendererSnake = ({ points, progress, opacity }: AnimationRendererSnakeProps) => {
  const gradientSeed = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradientId = `snakeCore-${gradientSeed}`;
  const { theme } = useBoardTheme();
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
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.snake.coreGradientStops[0]} />
          <stop offset="58%" stopColor={theme.snake.coreGradientStops[1]} />
          <stop offset="100%" stopColor={theme.snake.coreGradientStops[2]} />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={theme.snake.glowStroke}
        strokeWidth={theme.snake.glowStrokeWidth}
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
        stroke={`url(#${gradientId})`}
        strokeWidth={theme.snake.coreStrokeWidth}
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
          opacity={theme.snake.glyphOpacityBase + progress * theme.snake.glyphOpacityRange}
        />
        <ellipse
          cx="0"
          cy="0"
          rx={1.58}
          ry={1.08}
          fill={theme.snake.headFill}
          stroke={theme.snake.headStroke}
          strokeWidth={0.22}
        />
        <circle cx="0.42" cy="-0.14" r={0.16} fill={theme.snake.eyeFill} />
      </g>
    </g>
  );
};
