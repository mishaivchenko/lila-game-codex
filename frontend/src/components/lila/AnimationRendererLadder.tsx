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
      <path
        d={path}
        fill="none"
        stroke="rgba(44,191,175,0.22)"
        strokeWidth={2.5}
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
          x={-5.2}
          y={-5.2}
          width={10.4}
          height={10.4}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
      <path
        d={path}
        fill="none"
        stroke="#2CBFAF"
        strokeWidth={1.45}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.0001, progress)} 1`}
        data-testid="lila-ladder-rail"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(134,235,223,0.76)"
        strokeWidth={0.72}
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
              x={-1.7}
              y={-0.3}
              width={3.4}
              height={0.6}
              rx={0.2}
              fill="#8BE7DE"
              stroke="#1B8C80"
              strokeWidth={0.14}
            />
          </g>
        );
      })}

      <circle
        cx={climber.xPercent}
        cy={climber.yPercent}
        r={0.66}
        fill="#B9FFF7"
        opacity={0.85}
      />
    </g>
  );
};
