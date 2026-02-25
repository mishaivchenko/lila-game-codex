import { useEffect, useMemo, useRef, useState } from 'react';
import type { BoardType } from '../../domain/types';
import type { BoardPathPoint } from '../../lib/lila/boardProfiles/types';
import type { AnimationTimingSettings } from '../../lib/animations/animationTimingSettings';
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
  timings?: AnimationTimingSettings;
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
  timings,
}: LilaPathAnimationProps) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [drawProgress, setDrawProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [phase, setPhase] = useState<'draw' | 'travel' | 'hold' | 'fade'>('draw');
  const rafRef = useRef<number | undefined>(undefined);
  const timersRef = useRef<number[]>([]);
  const onProgressRef = useRef(onProgress);
  const onTravelCompleteRef = useRef(onTravelComplete);
  const onCompleteRef = useRef(onComplete);

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
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onTravelCompleteRef.current = onTravelComplete;
  }, [onTravelComplete]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let isEffectActive = true;
    setVisible(true);
    setProgress(0);
    setDrawProgress(0);
    setOpacity(1);
    setPhase('draw');

    const drawDuration = timings?.pathDrawDurationMs ?? 760;
    const travelDuration = timings?.pathTravelDurationMs ?? TRANSITION_TRAVEL_MS;
    const sequenceStartMs = performance.now();
    const drawEndMs = sequenceStartMs + drawDuration;
    let travelCompleted = false;

    const tick = (nowMs: number) => {
      if (!isEffectActive) {
        return;
      }

      if (nowMs < drawEndMs) {
        setPhase('draw');
        const linearDraw = Math.max(0, Math.min(1, (nowMs - sequenceStartMs) / drawDuration));
        const easedDraw = 0.5 - Math.cos(Math.PI * linearDraw) / 2;
        setDrawProgress(easedDraw);
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      setPhase('travel');
      setDrawProgress(1);
      const linearTravel = Math.max(0, Math.min(1, (nowMs - drawEndMs) / travelDuration));
      const easedTravel = 0.5 - Math.cos(Math.PI * linearTravel) / 2;
      setProgress(easedTravel);
      onProgressRef.current?.(easedTravel, samplePathByProgress(pathPoints, easedTravel));

      if (easedTravel < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (travelCompleted) {
        return;
      }
      travelCompleted = true;
      setPhase('hold');
      onTravelCompleteRef.current?.();

      const holdTimer = window.setTimeout(() => {
        if (!isEffectActive) {
          return;
        }
        setPhase('fade');
        setOpacity(0);
      }, timings?.pathPostHoldMs ?? TRANSITION_POST_HOLD_MS);

      const doneTimer = window.setTimeout(() => {
        if (!isEffectActive) {
          return;
        }
        setVisible(false);
        onCompleteRef.current?.();
      }, (timings?.pathPostHoldMs ?? TRANSITION_POST_HOLD_MS) + (timings?.pathFadeOutMs ?? TRANSITION_FADE_OUT_MS));

      timersRef.current.push(holdTimer, doneTimer);
    };

    onProgressRef.current?.(0, samplePathByProgress(pathPoints, 0));
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      isEffectActive = false;
      if (rafRef.current !== undefined) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [boardType, fromCell, pathPoints, toCell, timings?.pathDrawDurationMs, timings?.pathFadeOutMs, timings?.pathPostHoldMs, timings?.pathTravelDurationMs, type]);

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
        transition: phase === 'fade' ? `opacity ${timings?.pathFadeOutMs ?? TRANSITION_FADE_OUT_MS}ms ease-out` : undefined,
      }}
      data-testid={`lila-transition-${type}`}
    >
      {type === 'snake' ? (
        <AnimationRendererSnake points={pathPoints} progress={Math.max(drawProgress, progress)} opacity={opacity} />
      ) : (
        <AnimationRendererLadder points={pathPoints} progress={Math.max(drawProgress, progress)} opacity={opacity} />
      )}
    </svg>
  );
};
