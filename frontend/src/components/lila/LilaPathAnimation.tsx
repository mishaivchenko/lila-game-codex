import { useEffect, useMemo, useState } from 'react';
import snakeSpirit from '../../assets/lila/snake-spirit.svg';
import stairsLight from '../../assets/lila/stairs-light.svg';
import { getCellPosition } from '../../lib/lila/boardCoordinates';

interface LilaPathAnimationProps {
  fromCell: number;
  toCell: number;
  type: 'snake' | 'arrow';
}

const DRAW_DURATION_MS = 420;
const CLEAR_AFTER_MS = 1200;

const buildSnakePath = (fromX: number, fromY: number, toX: number, toY: number): string => {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const direction = toX > fromX ? 1 : -1;
  const arc = 5.4 * direction;

  return [
    `M ${fromX} ${fromY}`,
    `Q ${midX - arc} ${midY - 4}, ${midX} ${midY}`,
    `Q ${midX + arc} ${midY + 4}, ${toX} ${toY}`,
  ].join(' ');
};

const buildStairsPath = (fromX: number, fromY: number, toX: number, toY: number): string => {
  const steps = 5;
  let x = fromX;
  let y = fromY;
  let path = `M ${x} ${y}`;

  for (let i = 1; i <= steps; i += 1) {
    const nx = fromX + ((toX - fromX) / steps) * i;
    const ny = fromY + ((toY - fromY) / steps) * i;
    path += ` L ${nx} ${y} L ${nx} ${ny}`;
    x = nx;
    y = ny;
  }

  return `${path} L ${toX} ${toY}`;
};

export const LilaPathAnimation = ({ fromCell, toCell, type }: LilaPathAnimationProps) => {
  const [visible, setVisible] = useState(true);
  const [drawn, setDrawn] = useState(false);

  const from = useMemo(() => getCellPosition(fromCell), [fromCell]);
  const to = useMemo(() => getCellPosition(toCell), [toCell]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setDrawn(true));
    const timer = window.setTimeout(() => setVisible(false), CLEAR_AFTER_MS);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [fromCell, toCell, type]);

  if (!visible) {
    return null;
  }

  const path =
    type === 'snake'
      ? buildSnakePath(from.x, from.y, to.x, to.y)
      : buildStairsPath(from.x, from.y, to.x, to.y);

  const length = 42;
  const color = type === 'arrow' ? '#2CBFAF' : '#D18A43';
  const shadowColor = type === 'arrow' ? 'rgba(44,191,175,0.38)' : 'rgba(209,138,67,0.38)';
  const artIcon = type === 'arrow' ? stairsLight : snakeSpirit;
  const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

  return (
    <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={length}
        strokeDashoffset={drawn ? 0 : length}
        style={{
          filter: `drop-shadow(0 0 8px ${shadowColor})`,
          transition: `stroke-dashoffset ${DRAW_DURATION_MS}ms ease-out, opacity 300ms ease-out`,
          opacity: drawn ? 0.96 : 0.5,
        }}
        data-testid={`lila-path-${type}`}
      />

      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: drawn ? 0.4 : 0 }}
      />

      <image
        href={artIcon}
        x={midpoint.x - 2.2}
        y={midpoint.y - 2.2}
        width="4.4"
        height="4.4"
        style={{
          opacity: drawn ? 1 : 0,
          transformOrigin: `${midpoint.x}% ${midpoint.y}%`,
          animation: drawn ? 'lila-soft-float 1200ms ease-in-out infinite' : undefined,
        }}
        data-testid={`lila-art-${type}`}
      />

      {type === 'arrow' && (
        <circle
          cx={to.x}
          cy={to.y}
          r={1.2}
          fill={color}
          style={{ opacity: drawn ? 1 : 0, transition: 'opacity 220ms ease-out' }}
        />
      )}
    </svg>
  );
};
