import { useId, useMemo } from 'react';
import { getLilaVisualAssets } from '../../config/visualThemes';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { buildSmoothPath, buildStepSamples, sampleAngleByProgress, samplePathByProgress } from './pathAnimationMath';
import { useBoardTheme } from '../../theme';

interface AnimationRendererLadderProps {
  points: BoardPathPoint[];
  progress: number;
  opacity: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const AnimationRendererLadder = ({ points, progress, opacity }: AnimationRendererLadderProps) => {
  const gradientSeed = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradientId = `ladderRail-${gradientSeed}`;
  const { theme } = useBoardTheme();
  const stairsLight = useMemo(() => getLilaVisualAssets().stairsLight, []);
  const path = useMemo(() => buildSmoothPath(points), [points]);
  const steps = useMemo(() => buildStepSamples(points), [points]);
  const glyphPoint = useMemo(() => samplePathByProgress(points, Math.max(0.1, progress * 0.72)), [points, progress]);
  const glyphAngle = useMemo(() => sampleAngleByProgress(points, Math.max(0.1, progress * 0.72)), [points, progress]);
  const climber = useMemo(() => samplePathByProgress(points, progress), [points, progress]);

  return (
    <g style={{ opacity }} data-testid="lila-ladder-renderer">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.stairs.railGradientStops[0]} />
          <stop offset="100%" stopColor={theme.stairs.railGradientStops[1]} />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={theme.stairs.glowStroke}
        strokeWidth={theme.stairs.glowStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.0001, progress)} 1`}
        data-testid="lila-ladder-rail-glow"
      />

      <g
        transform={`translate(${glyphPoint.xPercent} ${glyphPoint.yPercent}) rotate(${glyphAngle}) scale(${0.58 + progress * 0.36})`}
        style={{ opacity: theme.stairs.glyphOpacityBase + progress * theme.stairs.glyphOpacityRange }}
      >
        <image
          href={stairsLight}
          x={-7}
          y={-7}
          width={14}
          height={14}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={theme.stairs.railStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.0001, progress)} 1`}
        data-testid="lila-ladder-rail"
      />
      <path
        d={path}
        fill="none"
        stroke={theme.stairs.highlightStroke}
        strokeWidth={theme.stairs.highlightStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.0001, progress)} 1`}
      />

      {steps.map((step, index) => {
        const threshold = (index + 1) / (steps.length + 1);
        const stepProgress = clamp01((progress - threshold) / 0.16);
        const scale = 0.1 + stepProgress * 0.9;

        return (
          <g
            key={`ladder-step-${index}`}
            transform={`translate(${step.point.xPercent} ${step.point.yPercent}) rotate(${step.angle}) scale(${scale})`}
            style={{ opacity: stepProgress }}
            data-testid={`lila-ladder-step-${index}`}
          >
            <rect
              x={-1.8}
              y={-0.26}
              width={3.6}
              height={theme.stairs.stepHeight}
              rx={theme.stairs.stepRadius}
              fill={theme.stairs.stepFill}
              stroke={theme.stairs.stepStroke}
              strokeWidth={theme.stairs.stepStrokeWidth}
            />
          </g>
        );
      })}

      <circle
        cx={climber.xPercent}
        cy={climber.yPercent}
        r={theme.stairs.climberRadius}
        fill={theme.stairs.climberFill}
        opacity={0.85}
      />
    </g>
  );
};
