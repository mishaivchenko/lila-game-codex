import { useEffect, useMemo, useState } from 'react';
import { getCellPosition } from '../../lib/lila/boardCoordinates';

interface LilaPathAnimationProps {
  fromCell: number;
  toCell: number;
  type: 'snake' | 'arrow';
}

const DRAW_DURATION_MS = 420;
const CLEAR_AFTER_MS = 760;

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

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const color = type === 'arrow' ? '#2CBFAF' : '#D18A43';
  const glow = type === 'arrow' ? 'drop-shadow(0 0 8px rgba(44,191,175,0.35))' : 'drop-shadow(0 0 8px rgba(209,138,67,0.35))';
  const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

  return (
    <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={drawn ? 0 : length}
        style={{
          filter: glow,
          transition: `stroke-dashoffset ${DRAW_DURATION_MS}ms ease-out`,
          opacity: drawn ? 0.95 : 0.55,
        }}
        data-testid={`lila-path-${type}`}
      />
      {type === 'arrow' && (
        <circle cx={to.x} cy={to.y} r={1.1} fill={color} style={{ opacity: drawn ? 1 : 0, transition: 'opacity 200ms ease-out' }} />
      )}
    </svg>
  );
};
