import { useEffect, useMemo, useRef, useState } from 'react';
import type { BoardType } from '../../domain/types';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import { mapCellToBoardPosition } from '../../lib/lila/mapCellToBoardPosition';
import { AnimationRendererLadder } from './AnimationRendererLadder';
import { AnimationRendererSnake } from './AnimationRendererSnake';
import { samplePathByProgress } from './pathAnimationMath';
import {
  TRANSITION_FADE_OUT_MS,
  TRANSITION_POST_HOLD_MS,
  TRANSITION_TRAVEL_MS,
} from './transitionAnimationConfig';

interface LilaPathAnimationProps {
  boardType: BoardType;
  fromCell: number;
  toCell: number;
  type: 'snake' | 'arrow';
  points?: BoardPathPoint[];
  onProgress?: (progress: number, point: BoardPathPoint) => void;
  onTravelComplete?: () => void;
  onComplete?: () => void;
}

export const LilaPathAnimation = ({
  boardType,
  fromCell,
  toCell,
  type,
  points,
  onProgress,
  onTravelComplete,
  onComplete,
}: LilaPathAnimationProps) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [phase, setPhase] = useState<'travel' | 'hold' | 'fade'>('travel');
  const travelIntervalRef = useRef<number | undefined>(undefined);
  const timersRef = useRef<number[]>([]);

  const from = useMemo(() => mapCellToBoardPosition(boardType, fromCell), [boardType, fromCell]);
  const to = useMemo(() => mapCellToBoardPosition(boardType, toCell), [boardType, toCell]);

  const pathPoints = useMemo(
    () =>
      points && points.length >= 2
        ? points
        : [
            { xPercent: from.xPercent, yPercent: from.yPercent },
            { xPercent: to.xPercent, yPercent: to.yPercent },
          ],
    [points, from.xPercent, from.yPercent, to.xPercent, to.yPercent],
  );

  useEffect(() => {
    setVisible(true);
    setProgress(0);
    setOpacity(1);
    setPhase('travel');

    let elapsedMs = 0;
    const updateTravel = () => {
      elapsedMs += 16;
      const nextProgress = Math.min(1, elapsedMs / TRANSITION_TRAVEL_MS);
      setProgress(nextProgress);
      onProgress?.(nextProgress, samplePathByProgress(pathPoints, nextProgress));

      if (nextProgress < 1) {
        return;
      }

      if (travelIntervalRef.current !== undefined) {
        window.clearInterval(travelIntervalRef.current);
        travelIntervalRef.current = undefined;
      }

      setPhase('hold');
      onTravelComplete?.();

      const holdTimer = window.setTimeout(() => {
        setPhase('fade');
        setOpacity(0);
      }, TRANSITION_POST_HOLD_MS);

      const doneTimer = window.setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, TRANSITION_POST_HOLD_MS + TRANSITION_FADE_OUT_MS);

      timersRef.current.push(holdTimer, doneTimer);
    };

    onProgress?.(0, samplePathByProgress(pathPoints, 0));
    travelIntervalRef.current = window.setInterval(updateTravel, 16);

    return () => {
      if (travelIntervalRef.current !== undefined) {
        window.clearInterval(travelIntervalRef.current);
        travelIntervalRef.current = undefined;
      }
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [boardType, fromCell, onComplete, onProgress, onTravelComplete, pathPoints, toCell, type]);

  if (!visible) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        opacity,
        transition: phase === 'fade' ? `opacity ${TRANSITION_FADE_OUT_MS}ms ease-out` : undefined,
      }}
      data-testid={`lila-transition-${type}`}
    >
      {type === 'snake' ? (
        <AnimationRendererSnake points={pathPoints} progress={progress} opacity={opacity} />
      ) : (
        <AnimationRendererLadder points={pathPoints} progress={progress} opacity={opacity} />
      )}
    </svg>
  );
};
