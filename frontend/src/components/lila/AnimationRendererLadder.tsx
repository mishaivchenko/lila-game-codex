import { useId, useMemo } from 'react';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import {
  buildOrthogonalStepPoints,
  buildPolylinePath,
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

  return (
    <StairsPath
      points={orthogonalPoints}
      path={path}
      gradientId={gradientId}
      progress={progress}
      opacity={opacity}
      style={theme.stairs}
    />
  );
};
