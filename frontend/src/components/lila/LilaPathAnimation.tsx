import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { BoardType } from '../../domain/types';
import { getLilaVisualAssets } from '../../config/visualThemes';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
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
  points?: BoardPathPoint[];
}

const CLEAR_AFTER_MS = 1200;

const buildSmoothPath = (points: BoardPathPoint[]): string => {
  if (points.length < 2) {
    return '';
  }
  if (points.length === 2) {
    return `M ${points[0].xPercent} ${points[0].yPercent} L ${points[1].xPercent} ${points[1].yPercent}`;
  }

  let d = `M ${points[0].xPercent} ${points[0].yPercent}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.xPercent + next.xPercent) / 2;
    const midY = (current.yPercent + next.yPercent) / 2;
    d += ` Q ${current.xPercent} ${current.yPercent}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.xPercent} ${last.yPercent}`;
  return d;
};

export const LilaPathAnimation = ({ boardType, fromCell, toCell, type, points }: LilaPathAnimationProps) => {
  const [visible, setVisible] = useState(true);
  const [drawn, setDrawn] = useState(false);
  const visuals = useMemo(() => getLilaVisualAssets(), []);

  const from = useMemo(() => mapCellToBoardPosition(boardType, fromCell), [boardType, fromCell]);
  const to = useMemo(() => mapCellToBoardPosition(boardType, toCell), [boardType, toCell]);

  useEffect(() => {
    setDrawn(true);
    const timer = window.setTimeout(() => setVisible(false), CLEAR_AFTER_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [boardType, fromCell, toCell, type]);

  if (!visible) {
    return null;
  }

  const pathPoints = points && points.length >= 2
    ? points
    : [
        { xPercent: from.xPercent, yPercent: from.yPercent },
        { xPercent: to.xPercent, yPercent: to.yPercent },
      ];

  const path = buildSmoothPath(pathPoints);

  const color = type === 'arrow' ? '#2CBFAF' : '#D18A43';
  const shadowColor = type === 'arrow' ? 'rgba(44,191,175,0.38)' : 'rgba(209,138,67,0.38)';
  const artIcon = type === 'arrow' ? visuals.stairsLight : visuals.snakeSpirit;
  const midpoint = {
    x: pathPoints[Math.floor(pathPoints.length / 2)]?.xPercent ?? (from.xPercent + to.xPercent) / 2,
    y: pathPoints[Math.floor(pathPoints.length / 2)]?.yPercent ?? (from.yPercent + to.yPercent) / 2,
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
