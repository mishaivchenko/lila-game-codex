import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { BoardType } from '../../domain/types';
import { BOARD_DEFINITIONS } from '../../content/boards';
import { resolveAssetUrl } from '../../content/assetBase';
import {
  PULSE_DURATION_MS,
  TOKEN_MOVE_DURATION_MS,
  activeCellGlowTransition,
  specialCellGlowTransition,
  tokenMoveTransition,
} from '../../lib/animations/lilaMotion';
import { getBoardProfile, getBoardTransitionPath } from '../../lib/lila/boardProfiles';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { mapCellToBoardPosition } from '../../lib/lila/mapCellToBoardPosition';
import type { LilaTransition } from './LilaBoard';
import { LilaPathAnimation } from './LilaPathAnimation';

interface LilaBoardCanvasProps {
  boardType: BoardType;
  currentCell: number;
  tokenColor?: string;
  otherTokens?: { id: string; cell: number; color: string }[];
  animationMove?: LilaTransition;
  onMoveAnimationComplete?: (moveId: string) => void;
}

const SPECIAL_PATH_TRAVEL_MS = TOKEN_MOVE_DURATION_MS;

const interpolatePathPoints = (points: BoardPathPoint[], progress: number): BoardPathPoint => {
  if (points.length === 0) {
    return { xPercent: 50, yPercent: 50 };
  }
  if (points.length === 1) {
    return points[0];
  }

  const lengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const dx = points[i + 1].xPercent - points[i].xPercent;
    const dy = points[i + 1].yPercent - points[i].yPercent;
    const len = Math.hypot(dx, dy);
    lengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) {
    return points[points.length - 1];
  }

  let targetDistance = totalLength * Math.max(0, Math.min(1, progress));
  for (let i = 0; i < lengths.length; i += 1) {
    if (targetDistance <= lengths[i]) {
      const segmentProgress = lengths[i] === 0 ? 1 : targetDistance / lengths[i];
      return {
        xPercent: points[i].xPercent + (points[i + 1].xPercent - points[i].xPercent) * segmentProgress,
        yPercent: points[i].yPercent + (points[i + 1].yPercent - points[i].yPercent) * segmentProgress,
      };
    }
    targetDistance -= lengths[i];
  }

  return points[points.length - 1];
};

export const LilaBoardCanvas = ({
  boardType,
  currentCell,
  tokenColor = '#1c1917',
  otherTokens = [],
  animationMove,
  onMoveAnimationComplete,
}: LilaBoardCanvasProps) => {
  const [tokenCell, setTokenCell] = useState(currentCell);
  const [pulseCell, setPulseCell] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState(0.64);
  const [activePath, setActivePath] = useState<LilaTransition | undefined>();
  const [tokenPathPosition, setTokenPathPosition] = useState<BoardPathPoint | undefined>();
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | undefined>(undefined);
  const boardProfile = useMemo(() => getBoardProfile(boardType), [boardType]);
  const specialTransitions = useMemo(() => {
    const board = BOARD_DEFINITIONS[boardType];
    const transitionByCell = new Map<number, 'snake' | 'arrow'>();
    board.snakes.forEach((snake) => transitionByCell.set(snake.from, 'snake'));
    board.arrows.forEach((arrow) => transitionByCell.set(arrow.from, 'arrow'));
    return transitionByCell;
  }, [boardType]);

  useEffect(() => {
    if (!animationMove) {
      setTokenCell(currentCell);
      setActivePath(undefined);
      setTokenPathPosition(undefined);
      return;
    }

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    if (rafRef.current !== undefined) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }

    const specialEntryCell = animationMove.entryCell ?? animationMove.fromCell;
    const transitionPath = animationMove.pathPoints
      ?? (animationMove.type
        ? getBoardTransitionPath(boardType, animationMove.type, specialEntryCell, animationMove.toCell)?.points
        : undefined);

    setPulseCell(animationMove.type ? specialEntryCell : animationMove.fromCell);
    setTokenCell(animationMove.fromCell);
    setTokenPathPosition(undefined);

    if (animationMove.type && transitionPath && transitionPath.length >= 2) {
      const pulseTimer = window.setTimeout(() => setPulseCell(null), PULSE_DURATION_MS);
      const toEntryTimer = window.setTimeout(() => {
        setTokenCell(specialEntryCell);
      }, 0);

      const startPathTimer = window.setTimeout(() => {
        setActivePath({
          ...animationMove,
          fromCell: specialEntryCell,
          pathPoints: transitionPath,
        });

        const startedAt = performance.now();
        const step = (now: number) => {
          const elapsed = now - startedAt;
          const progress = Math.min(1, elapsed / SPECIAL_PATH_TRAVEL_MS);
          setTokenPathPosition(interpolatePathPoints(transitionPath, progress));

          if (progress < 1) {
            rafRef.current = window.requestAnimationFrame(step);
            return;
          }

          setTokenPathPosition(undefined);
          setTokenCell(animationMove.toCell);
          setActivePath(undefined);
          rafRef.current = undefined;
          onMoveAnimationComplete?.(animationMove.id);
        };

        rafRef.current = window.requestAnimationFrame(step);
      }, TOKEN_MOVE_DURATION_MS);

      timersRef.current.push(pulseTimer, toEntryTimer, startPathTimer);
      return;
    }

    setPulseCell(null);
    setActivePath(undefined);
    const moveTimer = window.setTimeout(() => setTokenCell(animationMove.toCell), 0);
    const completeTimer = window.setTimeout(() => {
      onMoveAnimationComplete?.(animationMove.id);
    }, TOKEN_MOVE_DURATION_MS);

    timersRef.current.push(moveTimer, completeTimer);
  }, [animationMove, boardType, currentCell, onMoveAnimationComplete]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
      if (rafRef.current !== undefined) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
    };
  }, []);

  const tokenPosition = useMemo(
    () => mapCellToBoardPosition(boardType, tokenCell),
    [boardType, tokenCell],
  );
  const effectiveTokenPosition = tokenPathPosition ?? tokenPosition;

  const pulsePosition = pulseCell ? mapCellToBoardPosition(boardType, pulseCell) : undefined;
  const activeCellType = specialTransitions.get(currentCell);
  const shouldAnimateToken = Boolean(animationMove);
  const passiveTokens = otherTokens.map((token) => ({
    ...token,
    position: mapCellToBoardPosition(boardType, token.cell),
  }));

  return (
    <div className="relative mx-auto w-full max-w-[520px] rounded-3xl bg-stone-200/70 p-2 shadow-inner">
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio }} data-testid="lila-board-canvas">
        <img
          src={resolveAssetUrl(boardProfile.imageSrc)}
          alt={boardType === 'full' ? 'Lila full board' : 'Lila short board'}
          className="h-full w-full object-cover"
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth > 0 && naturalHeight > 0) {
              setAspectRatio(naturalWidth / naturalHeight);
            }
          }}
        />

        {activePath?.type && (
          <LilaPathAnimation
            key={`${activePath.id}-${boardType}`}
            boardType={boardType}
            fromCell={activePath.fromCell}
            toCell={activePath.toCell}
            type={activePath.type}
            points={activePath.pathPoints}
          />
        )}

        {pulsePosition && (
          <div
            className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${pulsePosition.xPercent}%`,
              top: `${pulsePosition.yPercent}%`,
              backgroundColor:
                activePath?.type === 'arrow'
                  ? 'rgba(44,191,175,0.22)'
                  : 'rgba(209,138,67,0.24)',
              border:
                activePath?.type === 'arrow'
                  ? '1px solid rgba(44,191,175,0.42)'
                  : '1px solid rgba(209,138,67,0.46)',
              animation: 'lila-soft-pulse 260ms ease-out 1',
            }}
          />
        )}

        <motion.div
          className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${tokenPosition.xPercent}%`,
            top: `${tokenPosition.yPercent}%`,
            background:
              activeCellType === 'arrow'
                ? 'radial-gradient(circle, rgba(44,191,175,0.2), rgba(44,191,175,0))'
                : activeCellType === 'snake'
                  ? 'radial-gradient(circle, rgba(209,138,67,0.24), rgba(209,138,67,0))'
                  : 'radial-gradient(circle, rgba(52,211,153,0.18), rgba(52,211,153,0))',
          }}
          animate={
            activeCellType
              ? { scale: [0.92, 1.12], opacity: [0.4, 0.95] }
              : { scale: [0.9, 1.05], opacity: [0.35, 0.7] }
          }
          transition={activeCellType ? specialCellGlowTransition : activeCellGlowTransition}
        />

        <motion.div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-stone-900 shadow-md"
          style={{
            left: `${effectiveTokenPosition.xPercent}%`,
            top: `${effectiveTokenPosition.yPercent}%`,
            backgroundColor: tokenColor,
            boxShadow:
              activePath?.type === 'arrow'
                ? '0 0 14px rgba(44,191,175,0.36)'
                : activePath?.type === 'snake'
                  ? '0 0 14px rgba(209,138,67,0.36)'
                  : undefined,
          }}
          animate={{
            left: `${effectiveTokenPosition.xPercent}%`,
            top: `${effectiveTokenPosition.yPercent}%`,
            scale: activePath?.type ? [1, 1.08, 1] : 1,
          }}
          transition={
            tokenPathPosition
              ? { duration: 0 }
              : shouldAnimateToken
                ? tokenMoveTransition
                : { duration: 0 }
          }
          aria-label="token"
        />

        {passiveTokens.map((token) => (
          <div
            key={token.id}
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 shadow-sm"
            style={{
              left: `${token.position.xPercent}%`,
              top: `${token.position.yPercent}%`,
              backgroundColor: token.color,
              opacity: 0.9,
            }}
            aria-label={`token-${token.id}`}
          />
        ))}
      </div>
    </div>
  );
};
