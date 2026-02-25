import { useId, useMemo } from 'react';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { buildSmoothPath, sampleAngleByProgress, samplePathByProgress } from './pathAnimationMath';
import { useBoardTheme } from '../../theme';
import { SnakePath } from './SnakePath';

interface AnimationRendererSnakeProps {
  points: BoardPathPoint[];
  progress: number;
  opacity: number;
  carryTokenColor?: string;
}

export const AnimationRendererSnake = ({ points, progress, opacity, carryTokenColor }: AnimationRendererSnakeProps) => {
  const gradientSeed = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradientId = `snakeCore-${gradientSeed}`;
  const { theme } = useBoardTheme();
  const path = useMemo(() => buildSmoothPath(points), [points]);
  const head = useMemo(() => samplePathByProgress(points, progress), [points, progress]);
  const angle = useMemo(() => sampleAngleByProgress(points, progress), [points, progress]);

  const reveal = Math.max(0.0001, progress);
  const headScale = 0.92 + progress * 0.2;
  const bodyWaveOffset = (1 - progress) * 0.42;

  return (
    <SnakePath
      path={path}
      gradientId={gradientId}
      reveal={reveal}
      bodyWaveOffset={bodyWaveOffset}
      headX={head.xPercent}
      headY={head.yPercent}
      headAngle={angle}
      headScale={headScale}
      carryTokenColor={carryTokenColor}
      style={theme.snake}
      opacity={opacity}
    />
  );
};
