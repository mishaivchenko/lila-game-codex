import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import type { StairsStyle } from '../../theme';

interface LadderStep {
  point: BoardPathPoint;
  angle: number;
}

interface StairsPathProps {
  path: string;
  gradientId: string;
  progress: number;
  opacity: number;
  glyphPoint: BoardPathPoint;
  glyphAngle: number;
  glyphScale: number;
  glyphOpacity: number;
  glyphHref: string;
  steps: LadderStep[];
  climber: BoardPathPoint;
  style: StairsStyle;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const StairsPath = ({
  path,
  gradientId,
  progress,
  opacity,
  glyphPoint,
  glyphAngle,
  glyphScale,
  glyphOpacity,
  glyphHref,
  steps,
  climber,
  style,
}: StairsPathProps) => {
  const reveal = Math.max(0.0001, progress);

  return (
    <g style={{ opacity }} data-testid="lila-ladder-renderer">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={style.railGradientStops[0]} />
          <stop offset="100%" stopColor={style.railGradientStops[1]} />
        </linearGradient>
      </defs>

      <path
        d={path}
        fill="none"
        stroke={style.glowStroke}
        strokeWidth={style.glowStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reveal} 1`}
        data-testid="lila-ladder-rail-glow"
      />

      <g transform={`translate(${glyphPoint.xPercent} ${glyphPoint.yPercent}) rotate(${glyphAngle}) scale(${glyphScale})`} style={{ opacity: glyphOpacity }}>
        <image
          href={glyphHref}
          x={-7}
          y={-7}
          width={14}
          height={14}
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: style.glyphFilter }}
        />
      </g>

      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={style.railStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reveal} 1`}
        data-testid="lila-ladder-rail"
      />
      <path
        d={path}
        fill="none"
        stroke={style.highlightStroke}
        strokeWidth={style.highlightStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reveal} 1`}
      />

      {steps.map((step, index) => {
        const threshold = (index + 1) / (steps.length + 1);
        const stepProgress = clamp01((progress - threshold) / 0.16);
        const scale = 0.1 + stepProgress * 0.9;

        return (
          <g
            key={`ladder-step-${index}-${step.point.xPercent}-${step.point.yPercent}`}
            transform={`translate(${step.point.xPercent} ${step.point.yPercent}) rotate(${step.angle}) scale(${scale})`}
            style={{ opacity: stepProgress }}
            data-testid={`lila-ladder-step-${index}`}
          >
            <rect
              x={-1.8}
              y={-0.26}
              width={3.6}
              height={style.stepHeight}
              rx={style.stepRadius}
              fill={style.stepFill}
              stroke={style.stepStroke}
              strokeWidth={style.stepStrokeWidth}
            />
          </g>
        );
      })}

      <circle cx={climber.xPercent} cy={climber.yPercent} r={style.climberRadius} fill={style.climberFill} opacity={0.85} />
    </g>
  );
};
