import { useId, useMemo } from 'react';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import {
  buildOrthogonalStepPoints,
  buildPolylinePath,
  buildStepSamples,
  sampleAngleByProgress,
  samplePathByProgress,
} from './pathAnimationMath';
import { useBoardTheme } from '../../theme';
import { StairsPath } from './StairsPath';

interface AnimationRendererLadderProps {
  points: BoardPathPoint[];
  progress: number;
  opacity: number;
}

export const AnimationRendererLadder = ({ points, progress, opacity }: AnimationRendererLadderProps) => {
  const gradientSeed = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradientId = `ladderRail-${gradientSeed}`;
  const { theme } = useBoardTheme();
  const orthogonalPoints = useMemo(() => buildOrthogonalStepPoints(points), [points]);
  const path = useMemo(() => buildPolylinePath(orthogonalPoints), [orthogonalPoints]);
  const steps = useMemo(() => buildStepSamples(orthogonalPoints, 3.2), [orthogonalPoints]);
  const glyphPoint = useMemo(
    () => samplePathByProgress(orthogonalPoints, Math.max(0.1, progress * 0.72)),
    [orthogonalPoints, progress],
  );
  const glyphAngle = useMemo(
    () => sampleAngleByProgress(orthogonalPoints, Math.max(0.1, progress * 0.72)),
    [orthogonalPoints, progress],
  );
  const climber = useMemo(() => samplePathByProgress(orthogonalPoints, progress), [orthogonalPoints, progress]);

  return (
    <StairsPath
      path={path}
      gradientId={gradientId}
      progress={progress}
      opacity={opacity}
      glyphPoint={glyphPoint}
      glyphAngle={glyphAngle}
      glyphScale={0.58 + progress * 0.36}
      glyphOpacity={theme.stairs.glyphOpacityBase + progress * theme.stairs.glyphOpacityRange}
      steps={steps}
      climber={climber}
      style={theme.stairs}
    />
  );
};
