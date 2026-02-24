import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import type { BoardType } from '../../domain/types';
import { BOARD_DEFINITIONS } from '../../content/boards';
import { resolveAssetUrl } from '../../content/assetBase';
import type { AnimationTimingSettings } from '../../lib/animations/animationTimingSettings';
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
import { resolveCellFromBoardPercent } from '../../lib/lila/resolveCellFromBoardPointer';
import type { LilaTransition } from './LilaBoard';
import { LilaPathAnimation } from './LilaPathAnimation';

interface LilaBoardCanvasProps {
  boardType: BoardType;
  currentCell: number;
  tokenColor?: string;
  otherTokens?: { id: string; cell: number; color: string }[];
  animationMove?: LilaTransition;
  animationTimings?: AnimationTimingSettings;
  onMoveAnimationComplete?: (moveId: string) => void;
  onCellSelect?: (cellNumber: number) => void;
  disableCellSelect?: boolean;
  holdTokenSync?: boolean;
}

export const LilaBoardCanvas = ({
  boardType,
  currentCell,
  tokenColor = '#1c1917',
  otherTokens = [],
  animationMove,
  animationTimings,
  onMoveAnimationComplete,
  onCellSelect,
  disableCellSelect = false,
  holdTokenSync = false,
}: LilaBoardCanvasProps) => {
  const [tokenCell, setTokenCell] = useState(currentCell);
  const [pulseCell, setPulseCell] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState(0.64);
  const [activePath, setActivePath] = useState<LilaTransition | undefined>();
  const [tokenPathPosition, setTokenPathPosition] = useState<BoardPathPoint | undefined>();
  const [tokenStepDurationMs, setTokenStepDurationMs] = useState(TOKEN_MOVE_DURATION_MS);
  const timersRef = useRef<number[]>([]);
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
      if (!holdTokenSync) {
        setTokenCell(currentCell);
      }
      setActivePath(undefined);
      setTokenPathPosition(undefined);
      return;
    }

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];

    const specialEntryCell = animationMove.entryCell ?? animationMove.fromCell;
    const tokenPathCells = animationMove.tokenPathCells && animationMove.tokenPathCells.length >= 2
      ? animationMove.tokenPathCells
      : animationMove.type && specialEntryCell !== animationMove.fromCell
        ? [animationMove.fromCell, specialEntryCell]
        : [animationMove.fromCell, animationMove.toCell];
    const pathStepCount = Math.max(1, tokenPathCells.length - 1);
    const tokenMoveDurationMs = animationTimings?.tokenMoveDurationMs ?? TOKEN_MOVE_DURATION_MS;
    const stepDurationMs = Math.max(140, tokenMoveDurationMs / pathStepCount);
    setTokenStepDurationMs(stepDurationMs);
    const transitionPath =
      animationMove.pathPoints ??
      (animationMove.type
        ? getBoardTransitionPath(boardType, animationMove.type, specialEntryCell, animationMove.toCell)?.points
        : undefined);

    setPulseCell(animationMove.type ? specialEntryCell : animationMove.fromCell);
    setTokenCell(animationMove.fromCell);
    setTokenPathPosition(undefined);

    tokenPathCells.slice(1).forEach((cell, index) => {
      const stepTimer = window.setTimeout(() => {
        setTokenCell(cell);
      }, Math.round((index + 1) * stepDurationMs));
      timersRef.current.push(stepTimer);
    });

    if (animationMove.type && transitionPath && transitionPath.length >= 2) {
      const pulseTimer = window.setTimeout(() => setPulseCell(null), PULSE_DURATION_MS);
      const startPathTimer = window.setTimeout(() => {
        setActivePath({
          ...animationMove,
          fromCell: specialEntryCell,
          pathPoints: transitionPath,
        });
      }, tokenMoveDurationMs);

      timersRef.current.push(pulseTimer, startPathTimer);
      return;
    }

    setPulseCell(null);
    setActivePath(undefined);
    const completeTimer = window.setTimeout(() => {
      onMoveAnimationComplete?.(animationMove.id);
    }, tokenMoveDurationMs);

    timersRef.current.push(completeTimer);
  }, [animationMove, animationTimings?.tokenMoveDurationMs, boardType, currentCell, holdTokenSync, onMoveAnimationComplete]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const tokenPosition = useMemo(
    () => mapCellToBoardPosition(boardType, tokenCell),
    [boardType, tokenCell],
  );
  const effectiveTokenPosition = tokenPathPosition ?? tokenPosition;

  const pulsePosition = pulseCell ? mapCellToBoardPosition(boardType, pulseCell) : undefined;
  const activeCellType = specialTransitions.get(currentCell);
  const shouldAnimateToken = Boolean(animationMove) && !tokenPathPosition;
  const passiveTokens = otherTokens.map((token) => ({
    ...token,
    position: mapCellToBoardPosition(boardType, token.cell),
  }));
  const handleBoardPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (disableCellSelect || !onCellSelect) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    const cell = resolveCellFromBoardPercent(boardType, { xPercent, yPercent });
    if (cell) {
      onCellSelect(cell);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[520px] rounded-3xl bg-stone-200/70 p-2 shadow-inner">
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio }}
        data-testid="lila-board-canvas"
        onPointerUp={handleBoardPointerUp}
      >
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
            timings={animationTimings}
            onProgress={(_, point) => {
              setTokenPathPosition(point);
            }}
            onTravelComplete={() => {
              setTokenPathPosition(undefined);
              setTokenCell(activePath.toCell);
            }}
            onComplete={() => {
              setActivePath(undefined);
              onMoveAnimationComplete?.(activePath.id);
            }}
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
            shouldAnimateToken
              ? { ...tokenMoveTransition, duration: tokenStepDurationMs / 1000 }
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
