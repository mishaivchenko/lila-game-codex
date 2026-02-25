import type { StairsStyle } from '../../theme';

interface StairsPathProps {
  path: string;
  gradientId: string;
  progress: number;
  opacity: number;
  style: StairsStyle;
}

export const StairsPath = ({
  path,
  gradientId,
  progress,
  opacity,
  style,
}: StairsPathProps) => {
  const railOpacity = 0.35 + progress * 0.65;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const revealDash = `${Math.max(0.001, clampedProgress)} 1`;

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
        strokeLinecap="butt"
        strokeLinejoin="miter"
        pathLength={1}
        strokeDasharray={revealDash}
        opacity={railOpacity * 0.75}
        data-testid="lila-ladder-rail-glow"
      />

      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={style.railStrokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
        pathLength={1}
        strokeDasharray={revealDash}
        opacity={railOpacity}
        data-testid="lila-ladder-rail"
      />
      <path
        d={path}
        fill="none"
        stroke={style.highlightStroke}
        strokeWidth={Math.max(0.4, style.highlightStrokeWidth)}
        strokeLinecap="butt"
        strokeLinejoin="miter"
        pathLength={1}
        strokeDasharray={revealDash}
        opacity={railOpacity}
        data-testid="lila-ladder-step-0"
      />
    </g>
  );
};
