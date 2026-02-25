import type { ReactNode } from 'react';
import type { SnakeStyle } from '../../theme';

interface SnakePathProps {
  path: string;
  gradientId: string;
  reveal: number;
  bodyWaveOffset: number;
  headX: number;
  headY: number;
  headAngle: number;
  headScale: number;
  style: SnakeStyle;
  opacity: number;
  children?: ReactNode;
}

export const SnakePath = ({
  path,
  gradientId,
  reveal,
  bodyWaveOffset,
  headX,
  headY,
  headAngle,
  headScale,
  style,
  opacity,
  children,
}: SnakePathProps) => {
  const renderHeadDecoration = () => {
    if (style.variantId === 'ribbon') {
      return (
        <path
          d="M -0.8 -0.6 L 0.9 0 L -0.8 0.6"
          fill="none"
          stroke={style.headStroke}
          strokeWidth={0.2}
          strokeLinecap="round"
          opacity={0.9}
        />
      );
    }
    if (style.variantId === 'sigil') {
      return (
        <>
          <rect x={-0.55} y={-0.55} width={1.1} height={1.1} rx={0.12} fill="none" stroke={style.headStroke} strokeWidth={0.16} />
          <circle cx="0" cy="0" r={0.2} fill={style.eyeFill} />
        </>
      );
    }
    return <circle cx="0.42" cy="-0.14" r={0.16} fill={style.eyeFill} />;
  };

  return (
    <g style={{ opacity }} data-testid="lila-snake-renderer">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={style.coreGradientStops[0]} />
          <stop offset="58%" stopColor={style.coreGradientStops[1]} />
          <stop offset="100%" stopColor={style.coreGradientStops[2]} />
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
        strokeDasharray={`${reveal} ${Math.max(0.0001, 1 - reveal)}`}
        strokeDashoffset={bodyWaveOffset}
        data-testid="lila-snake-body-glow"
      />
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={style.coreStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reveal} ${Math.max(0.0001, 1 - reveal)}`}
        strokeDashoffset={bodyWaveOffset * 0.66}
        data-testid="lila-snake-body"
      />
      <g transform={`translate(${headX} ${headY}) rotate(${headAngle}) scale(${headScale})`} data-testid="lila-snake-head">
        <ellipse cx="0" cy="0" rx={1.58} ry={1.08} fill={style.headFill} stroke={style.headStroke} strokeWidth={0.22} />
        {renderHeadDecoration()}
        {children}
      </g>
    </g>
  );
};
