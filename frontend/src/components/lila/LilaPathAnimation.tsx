import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import snakeSpirit from '../../assets/lila/snake-spirit.svg';
import stairsLight from '../../assets/lila/stairs-light.svg';
import type { BoardType } from '../../domain/types';
import {
  PATH_DRAW_DURATION_MS,
  pathDrawTransition,
  pathGlideTransition,
} from '../../lib/animations/lilaMotion';
import { mapCellToBoardPosition } from '../../lib/lila/mapCellToBoardPosition';

interface LilaPathAnimationProps {
  boardType: BoardType;
  fromCell: number;
  toCell: number;
  type: 'snake' | 'arrow';
}

const CLEAR_AFTER_MS = 1200;

const buildSnakePath = (fromX: number, fromY: number, toX: number, toY: number): string => {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const direction = toX > fromX ? 1 : -1;
  const arc = 6.4 * direction;

  return [
    `M ${fromX} ${fromY}`,
    `Q ${midX - arc} ${midY - 5}, ${midX} ${midY}`,
    `Q ${midX + arc} ${midY + 5}, ${toX} ${toY}`,
  ].join(' ');
};

const buildArrowPath = (fromX: number, fromY: number, toX: number, toY: number): string => {
  const controlX = (fromX + toX) / 2;
  const controlY = Math.min(fromY, toY) - 4.5;
  return `M ${fromX} ${fromY} Q ${controlX} ${controlY}, ${toX} ${toY}`;
};

export const LilaPathAnimation = ({ boardType, fromCell, toCell, type }: LilaPathAnimationProps) => {
  const [visible, setVisible] = useState(true);
  const [drawn, setDrawn] = useState(false);

  const from = useMemo(() => mapCellToBoardPosition(boardType, fromCell), [boardType, fromCell]);
  const to = useMemo(() => mapCellToBoardPosition(boardType, toCell), [boardType, toCell]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setDrawn(true));
    const timer = window.setTimeout(() => setVisible(false), CLEAR_AFTER_MS);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [boardType, fromCell, toCell, type]);

  if (!visible) {
    return null;
  }

  const path =
    type === 'snake'
      ? buildSnakePath(from.xPercent, from.yPercent, to.xPercent, to.yPercent)
      : buildArrowPath(from.xPercent, from.yPercent, to.xPercent, to.yPercent);

  const color = type === 'arrow' ? '#2CBFAF' : '#D18A43';
  const shadowColor = type === 'arrow' ? 'rgba(44,191,175,0.38)' : 'rgba(209,138,67,0.38)';
  const artIcon = type === 'arrow' ? stairsLight : snakeSpirit;
  const midpoint = {
    x: (from.xPercent + to.xPercent) / 2,
    y: (from.yPercent + to.yPercent) / 2,
  };

  return (
    <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={100}
        initial={{ strokeDashoffset: 100, opacity: 0.52 }}
        animate={{ strokeDashoffset: drawn ? 0 : 100, opacity: drawn ? 0.96 : 0.52 }}
        transition={pathDrawTransition}
        style={{
          filter: `drop-shadow(0 0 8px ${shadowColor})`,
        }}
        data-testid={`lila-path-${type}`}
      />

      <motion.circle
        cx={from.xPercent}
        cy={from.yPercent}
        r={1.1}
        fill={type === 'arrow' ? '#6AE4D5' : '#F0BA6D'}
        initial={{ opacity: 0 }}
        animate={{
          cx: drawn ? to.xPercent : from.xPercent,
          cy: drawn ? to.yPercent : from.yPercent,
          opacity: drawn ? [0, 0.95, 0.15] : 0,
        }}
        transition={pathGlideTransition}
      />

      <image
        href={artIcon}
        x={midpoint.x - 2.2}
        y={midpoint.y - 2.2}
        width="4.4"
        height="4.4"
        style={{
          opacity: drawn ? 1 : 0,
          animation: drawn ? 'lila-soft-float 1200ms ease-in-out infinite' : undefined,
        }}
        data-testid={`lila-art-${type}`}
      />

      {type === 'arrow' && (
        <motion.circle
          cx={to.xPercent}
          cy={to.yPercent}
          r={1.2}
          fill={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: drawn ? 1 : 0 }}
          transition={{ duration: PATH_DRAW_DURATION_MS / 1000 }}
        />
      )}
    </svg>
  );
};
