import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { BoardType } from '../../domain/types';
import { BOARD_DEFINITIONS } from '../../content/boards';
import {
  PATH_DRAW_DURATION_MS,
  PULSE_DURATION_MS,
  TOKEN_MOVE_DURATION_MS,
  activeCellGlowTransition,
  specialCellGlowTransition,
  tokenMoveTransition,
} from '../../lib/animations/lilaMotion';
import { mapCellToBoardPosition } from '../../lib/lila/mapCellToBoardPosition';
import type { LilaTransition } from './LilaBoard';
import { LilaPathAnimation } from './LilaPathAnimation';

interface LilaBoardCanvasProps {
  boardType: BoardType;
  currentCell: number;
  animationMove?: LilaTransition;
  onMoveAnimationComplete?: (moveId: string) => void;
}

const PATH_DURATION_MS = PATH_DRAW_DURATION_MS;

const FULL_BOARD_IMAGE = encodeURI('/field/НОВИЙ ДИЗАЙН.png');
const SHORT_BOARD_IMAGE = '/field/lila-board-short.png';

const getBoardImage = (boardType: BoardType): string =>
  boardType === 'full' ? FULL_BOARD_IMAGE : SHORT_BOARD_IMAGE;

export const LilaBoardCanvas = ({
  boardType,
  currentCell,
  animationMove,
  onMoveAnimationComplete,
}: LilaBoardCanvasProps) => {
  const [tokenCell, setTokenCell] = useState(currentCell);
  const [pulseCell, setPulseCell] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState(0.64);
  const [activePath, setActivePath] = useState<LilaTransition | undefined>();
  const timersRef = useRef<number[]>([]);
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
      return;
    }

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];

    setPulseCell(animationMove.fromCell);
    setTokenCell(animationMove.fromCell);

    if (animationMove.type) {
      setActivePath(animationMove);
      const pulseTimer = window.setTimeout(() => setPulseCell(null), PULSE_DURATION_MS);
      const moveTimer = window.setTimeout(() => setTokenCell(animationMove.toCell), PATH_DURATION_MS);
      const completeTimer = window.setTimeout(() => {
        setActivePath(undefined);
        onMoveAnimationComplete?.(animationMove.id);
      }, PATH_DURATION_MS + TOKEN_MOVE_DURATION_MS);

      timersRef.current.push(pulseTimer, moveTimer, completeTimer);
      return;
    }

    setPulseCell(null);
    setActivePath(undefined);
    const moveTimer = window.setTimeout(() => setTokenCell(animationMove.toCell), 0);
    const completeTimer = window.setTimeout(() => {
      onMoveAnimationComplete?.(animationMove.id);
    }, TOKEN_MOVE_DURATION_MS);

    timersRef.current.push(moveTimer, completeTimer);
  }, [animationMove, currentCell, onMoveAnimationComplete]);

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

  const pulsePosition = pulseCell ? mapCellToBoardPosition(boardType, pulseCell) : undefined;
  const activeCellType = specialTransitions.get(currentCell);

  return (
    <div className="relative mx-auto w-full max-w-[520px] rounded-3xl bg-stone-200/70 p-2 shadow-inner">
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio }} data-testid="lila-board-canvas">
        <img
          src={getBoardImage(boardType)}
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
            left: `${tokenPosition.xPercent}%`,
            top: `${tokenPosition.yPercent}%`,
            boxShadow:
              activePath?.type === 'arrow'
                ? '0 0 14px rgba(44,191,175,0.36)'
                : activePath?.type === 'snake'
                  ? '0 0 14px rgba(209,138,67,0.36)'
                  : undefined,
          }}
          animate={{
            left: `${tokenPosition.xPercent}%`,
            top: `${tokenPosition.yPercent}%`,
            scale: activePath?.type ? [1, 1.08, 1] : 1,
          }}
          transition={tokenMoveTransition}
          aria-label="token"
        />
      </div>
    </div>
  );
};
