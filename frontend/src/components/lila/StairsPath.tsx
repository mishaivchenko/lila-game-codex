import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import type { StairsStyle } from '../../theme';

interface StairsPathProps {
  points: BoardPathPoint[];
  path: string;
  gradientId: string;
  progress: number;
  opacity: number;
  style: StairsStyle;
}

export const StairsPath = ({
  points,
  path,
  gradientId,
  progress,
  opacity,
  style,
}: StairsPathProps) => {
  const railOpacity = 0.35 + progress * 0.65;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const revealDash = `${Math.max(0.001, clampedProgress)} 1`;
  const cornerArm = Math.max(0.7, style.stepHeight * 1.25);

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

      {points.slice(1, -1).map((corner, index) => {
        const prev = points[index];
        const next = points[index + 2];
        if (!prev || !next) {
          return null;
        }

        const inDx = Math.sign(corner.xPercent - prev.xPercent);
        const inDy = Math.sign(corner.yPercent - prev.yPercent);
        const outDx = Math.sign(next.xPercent - corner.xPercent);
        const outDy = Math.sign(next.yPercent - corner.yPercent);
        const isCorner = (Math.abs(inDx) > 0 || Math.abs(inDy) > 0) && (Math.abs(outDx) > 0 || Math.abs(outDy) > 0) && (inDx !== outDx || inDy !== outDy);
        if (!isCorner) {
          return null;
        }

        const threshold = (index + 1) / Math.max(2, points.length - 1);
        if (clampedProgress < threshold) {
          return null;
        }

        const x1 = corner.xPercent - inDx * cornerArm;
        const y1 = corner.yPercent - inDy * cornerArm;
        const x2 = corner.xPercent + outDx * cornerArm;
        const y2 = corner.yPercent + outDy * cornerArm;
        const markerPath = `M ${x1} ${y1} L ${corner.xPercent} ${corner.yPercent} L ${x2} ${y2}`;

        return (
          <g key={`ladder-corner-${index}`} opacity={0.86}>
            <path
              d={markerPath}
              fill="none"
              stroke={style.stepStroke}
              strokeWidth={Math.max(style.stepStrokeWidth + 0.55, style.highlightStrokeWidth + 0.35)}
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <circle
              cx={corner.xPercent}
              cy={corner.yPercent}
              r={Math.max(0.18, style.stepRadius * 0.75)}
              fill={style.stepFill}
              stroke={style.stepStroke}
              strokeWidth={Math.max(0.08, style.stepStrokeWidth * 0.7)}
            />
          </g>
        );
      })}
    </g>
  );
};
