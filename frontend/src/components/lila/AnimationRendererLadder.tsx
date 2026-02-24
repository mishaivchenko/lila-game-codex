import { useMemo } from 'react';
import { getLilaVisualAssets } from '../../config/visualThemes';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { buildSmoothPath, buildStepSamples, sampleAngleByProgress, samplePathByProgress } from './pathAnimationMath';

interface AnimationRendererLadderProps {
  points: BoardPathPoint[];
  progress: number;
  opacity: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const AnimationRendererLadder = ({ points, progress, opacity }: AnimationRendererLadderProps) => {
  const stairsLight = useMemo(() => getLilaVisualAssets().stairsLight, []);
  const path = useMemo(() => buildSmoothPath(points), [points]);
  const steps = useMemo(() => buildStepSamples(points), [points]);
  const glyphPoint = useMemo(() => samplePathByProgress(points, Math.max(0.1, progress * 0.72)), [points, progress]);
  const glyphAngle = useMemo(() => sampleAngleByProgress(points, Math.max(0.1, progress * 0.72)), [points, progress]);
  const climber = useMemo(() => samplePathByProgress(points, progress), [points, progress]);

  return (
    <g style={{ opacity }} data-testid="lila-ladder-renderer">
      <defs>
        <linearGradient id="ladderMinimalRail" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C3D2DE" />
          <stop offset="100%" stopColor="#7EE5FF" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="rgba(120,171,200,0.22)"
        strokeWidth={2.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.0001, progress)} 1`}
        data-testid="lila-ladder-rail-glow"
      />

      <g
        transform={`translate(${glyphPoint.xPercent} ${glyphPoint.yPercent}) rotate(${glyphAngle}) scale(${0.58 + progress * 0.36})`}
        style={{ opacity: 0.22 + progress * 0.44 }}
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
        stroke="url(#ladderMinimalRail)"
        strokeWidth={1.65}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.0001, progress)} 1`}
        data-testid="lila-ladder-rail"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(208,242,255,0.72)"
        strokeWidth={0.62}
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
            key={`${step.point.xPercent}-${step.point.yPercent}`}
            transform={`translate(${step.point.xPercent} ${step.point.yPercent}) rotate(${step.angle}) scale(${scale})`}
            style={{ opacity: stepProgress }}
            data-testid={`lila-ladder-step-${index}`}
          >
            <rect
              x={-1.8}
              y={-0.26}
              width={3.6}
              height={0.52}
              rx={0.14}
              fill="#DDF1FF"
              stroke="#6D94A9"
              strokeWidth={0.14}
            />
          </g>
        );
      })}

      <circle
        cx={climber.xPercent}
        cy={climber.yPercent}
        r={0.62}
        fill="#E8F8FF"
        opacity={0.85}
      />
    </g>
  );
};
