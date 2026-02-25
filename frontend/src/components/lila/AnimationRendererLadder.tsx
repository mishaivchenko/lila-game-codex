import { useId, useMemo } from 'react';
import { getLilaVisualAssets } from '../../config/visualThemes';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { buildSmoothPath, buildStepSamples, sampleAngleByProgress, samplePathByProgress } from './pathAnimationMath';
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
  const stairsLight = useMemo(() => getLilaVisualAssets(theme.visualAssetTheme).stairsLight, [theme.visualAssetTheme]);
  const path = useMemo(() => buildSmoothPath(points), [points]);
  const steps = useMemo(() => buildStepSamples(points), [points]);
  const glyphPoint = useMemo(() => samplePathByProgress(points, Math.max(0.1, progress * 0.72)), [points, progress]);
  const glyphAngle = useMemo(() => sampleAngleByProgress(points, Math.max(0.1, progress * 0.72)), [points, progress]);
  const climber = useMemo(() => samplePathByProgress(points, progress), [points, progress]);

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
      glyphHref={stairsLight}
      steps={steps}
      climber={climber}
      style={theme.stairs}
    />
  );
};
