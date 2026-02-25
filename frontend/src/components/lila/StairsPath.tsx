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
  steps,
  climber,
  style,
}: StairsPathProps) => {
  const railOpacity = 0.25 + progress * 0.75;

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
        opacity={railOpacity * 0.75}
        data-testid="lila-ladder-rail-glow"
      />

      <g transform={`translate(${glyphPoint.xPercent} ${glyphPoint.yPercent}) rotate(${glyphAngle}) scale(${glyphScale})`} style={{ opacity: glyphOpacity }}>
        {style.variantId === 'beam' ? (
          <path d="M -1.8 0 L 1.8 0 M -1.2 -0.6 L 1.2 -0.6 M -0.6 0.6 L 0.6 0.6" stroke={style.stepStroke} strokeWidth={0.24} strokeLinecap="round" />
        ) : style.variantId === 'arc' ? (
          <path d="M -1.4 0.7 Q 0 -1.2 1.4 0.7" fill="none" stroke={style.stepStroke} strokeWidth={0.26} strokeLinecap="round" />
        ) : (
          <rect x={-1.4} y={-0.4} width={2.8} height={0.8} rx={0.26} fill={style.stepFill} stroke={style.stepStroke} strokeWidth={0.18} />
        )}
      </g>

      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={style.railStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={railOpacity}
        data-testid="lila-ladder-rail"
      />
      <path
        d={path}
        fill="none"
        stroke={style.highlightStroke}
        strokeWidth={style.highlightStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={railOpacity * 0.7}
      />

      {steps.map((step, index) => {
        const threshold = (index + 1) / (steps.length + 1);
        const stepProgress = clamp01((progress - threshold) / 0.16);
        const scale = 0.1 + stepProgress * 0.9;
        const sharpRadius = Math.min(0.08, style.stepRadius * 0.35);

        return (
          <g
            key={`ladder-step-${index}-${step.point.xPercent}-${step.point.yPercent}`}
            transform={`translate(${step.point.xPercent} ${step.point.yPercent}) rotate(${step.angle}) scale(${scale})`}
            style={{ opacity: stepProgress }}
            data-testid={`lila-ladder-step-${index}`}
          >
            {style.variantId === 'beam' ? (
              <line
                x1={-1.85}
                y1={0}
                x2={1.85}
                y2={0}
                stroke={style.stepStroke}
                strokeWidth={style.stepStrokeWidth + 0.18}
                strokeLinecap="round"
              />
            ) : (
              <rect
                x={-1.8}
                y={-0.26}
                width={3.6}
                height={style.stepHeight}
                rx={sharpRadius}
                fill={style.stepFill}
                stroke={style.stepStroke}
                strokeWidth={style.stepStrokeWidth}
              />
            )}
          </g>
        );
      })}

      <circle cx={climber.xPercent} cy={climber.yPercent} r={style.climberRadius} fill={style.climberFill} opacity={0.85} />
    </g>
  );
};
