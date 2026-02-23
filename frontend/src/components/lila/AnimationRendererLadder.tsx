import { useMemo } from 'react';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { buildSmoothPath, buildStepSamples } from './pathAnimationMath';

interface AnimationRendererLadderProps {
  points: BoardPathPoint[];
  progress: number;
  opacity: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const AnimationRendererLadder = ({ points, progress, opacity }: AnimationRendererLadderProps) => {
  const path = useMemo(() => buildSmoothPath(points), [points]);
  const steps = useMemo(() => buildStepSamples(points), [points]);

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
    </g>
  );
};
