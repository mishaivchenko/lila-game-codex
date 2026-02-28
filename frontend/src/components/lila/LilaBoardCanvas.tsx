import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import type { BoardType } from '../../domain/types';
import { BOARD_DEFINITIONS } from '../../content/boards';
import { resolveAssetUrl } from '../../content/assetBase';
import { createBoardCameraEngine } from '../../engine/camera/BoardCameraEngine';
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
import { DEFAULT_BOARD_ZOOM_SETTINGS, resolveFocusedZoom } from '../../lib/lila/boardZoomSettings';
import { resolveCellFromBoardPercent } from '../../lib/lila/resolveCellFromBoardPointer';
import { selectBoardImageAsset } from '../../lib/lila/selectBoardImageAsset';
import type { LilaTransition } from './LilaBoard';
import { LilaPathAnimation } from './LilaPathAnimation';
import { useBoardTheme } from '../../theme';
import { BoardSceneContainer } from '../../ui/board/BoardSceneContainer';
import { createMovementEngine, DEFAULT_MOVEMENT_SETTINGS, type MovementSettings } from '../../engine/movement/MovementEngine';

interface LilaBoardCanvasProps {
  boardType: BoardType;
  currentCell: number;
  tokenColor?: string;
  otherTokens?: { id: string; cell: number; color: string }[];
  animationMove?: LilaTransition;
  animationTimings?: AnimationTimingSettings;
  movementSettings?: MovementSettings;
  onMoveAnimationComplete?: (moveId: string) => void;
  onCellSelect?: (cellNumber: number) => void;
  disableCellSelect?: boolean;
  holdTokenSync?: boolean;
}

const toResolvedSrcSet = (value: string): string =>
  value
    .split(',')
    .map((segment) => {
      const trimmed = segment.trim();
      if (!trimmed) {
        return trimmed;
      }
      const [url, descriptor] = trimmed.split(/\s+/);
      return descriptor ? `${resolveAssetUrl(url)} ${descriptor}` : resolveAssetUrl(url);
    })
    .join(', ');

export const LilaBoardCanvas = ({
  boardType,
  currentCell,
  tokenColor,
  otherTokens = [],
  animationMove,
  animationTimings,
  movementSettings = DEFAULT_MOVEMENT_SETTINGS,
  onMoveAnimationComplete,
  onCellSelect,
  disableCellSelect = false,
  holdTokenSync = false,
}: LilaBoardCanvasProps) => {
  const { theme } = useBoardTheme();
  const isTouchDevice = typeof window !== 'undefined'
    && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);
  const focusedZoom = resolveFocusedZoom(DEFAULT_BOARD_ZOOM_SETTINGS, isTouchDevice);
  const [tokenCell, setTokenCell] = useState(currentCell);
  const [pulseCell, setPulseCell] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState(0.64);
  const [activePath, setActivePath] = useState<LilaTransition | undefined>();
  const [tokenPathPosition, setTokenPathPosition] = useState<BoardPathPoint | undefined>();
  const [tokenStepDurationMs, setTokenStepDurationMs] = useState(TOKEN_MOVE_DURATION_MS);
  const [isBoardImageReady, setIsBoardImageReady] = useState(false);
  const [activeBoardSrc, setActiveBoardSrc] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState(() => ({
    zoom: 1,
    targetZoom: 1,
    panX: 0,
    panY: 0,
  }));
  const [viewportSize, setViewportSize] = useState({ width: 100, height: 100 });
  const timersRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const followModeRef = useRef(false);
  const cameraSnapshotRef = useRef(cameraState);
  const followPointRef = useRef({ x: 50, y: 50 });
  const lastTapRef = useRef<{
    time: number;
    x: number;
    y: number;
  } | null>(null);
  const singleTapTimerRef = useRef<number | null>(null);
  const processedAnimationIdRef = useRef<string | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);
  const cameraEngineRef = useRef(
    createBoardCameraEngine({
      viewportWidth: 100,
      viewportHeight: 100,
      worldWidth: 100,
      worldHeight: 100,
      zoom: 1,
      maxZoom: DEFAULT_BOARD_ZOOM_SETTINGS.maxZoom,
    }),
  );
  const boardProfile = useMemo(() => getBoardProfile(boardType), [boardType]);
  const boardImageSelection = useMemo(
    () =>
      selectBoardImageAsset(boardProfile.imageAssets, {
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
        zoom: Math.max(cameraState.zoom, cameraState.targetZoom),
      }),
    [boardProfile.imageAssets, cameraState.targetZoom, cameraState.zoom, viewportSize.height, viewportSize.width],
  );
  const specialTransitions = useMemo(() => {
    const board = BOARD_DEFINITIONS[boardType];
    const transitionByCell = new Map<number, 'snake' | 'arrow'>();
    board.snakes.forEach((snake) => transitionByCell.set(snake.from, 'snake'));
    board.arrows.forEach((arrow) => transitionByCell.set(arrow.from, 'arrow'));
    return transitionByCell;
  }, [boardType]);

  useEffect(() => {
    const image = new Image();
    image.decoding = 'async';
    const nextSrc = resolveAssetUrl(boardImageSelection.fallbackSrc);
    let isCancelled = false;

    if (!activeBoardSrc || !activeBoardSrc.includes(boardType)) {
      setIsBoardImageReady(false);
    }

    image.src = nextSrc;
    image.onload = () => {
      if (isCancelled) {
        return;
      }
      setActiveBoardSrc(nextSrc);
      setIsBoardImageReady(true);
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setAspectRatio(image.naturalWidth / image.naturalHeight);
      }
    };
    return () => {
      isCancelled = true;
    };
  }, [activeBoardSrc, boardImageSelection.fallbackSrc, boardType]);

  useEffect(() => {
    const camera = cameraEngineRef.current;
    let frameId = 0;
    let previous = performance.now();
    let isActive = true;

    const tick = (now: number) => {
      if (!isActive) {
        return;
      }
      const dt = now - previous;
      previous = now;
      camera.update(dt);
      const next = camera.getSnapshot();
      const prev = cameraSnapshotRef.current;
      if (
        Math.abs(next.zoom - prev.zoom) > 0.001
        || Math.abs(next.panX - prev.panX) > 0.25
        || Math.abs(next.panY - prev.panY) > 0.25
      ) {
        cameraSnapshotRef.current = next;
        setCameraState(next);
      }
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => {
      isActive = false;
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) {
      return;
    }

    const camera = cameraEngineRef.current;
    const updateViewport = () => {
      const rect = element.getBoundingClientRect();
      camera.setViewport({ width: rect.width, height: rect.height });
      camera.setWorldBounds({ width: rect.width, height: rect.height });
      setViewportSize({ width: rect.width, height: rect.height });
    };

    updateViewport();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(updateViewport);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  const isMovingWithCamera = Boolean(animationMove || activePath);

  useEffect(() => {
    const camera = cameraEngineRef.current;
    if (isMovingWithCamera) {
      if (!followModeRef.current) {
        followModeRef.current = true;
        camera.follow({
          id: 'token',
          point: {
            x: followPointRef.current.x,
            y: followPointRef.current.y,
          },
        });
        void camera.animateZoom(focusedZoom, {
          durationMs: DEFAULT_BOARD_ZOOM_SETTINGS.zoomInDurationMs,
          easing: 'easeOut',
        });
      }
      return;
    }

    if (!followModeRef.current) {
      return;
    }
    followModeRef.current = false;
    camera.clearFollow();
    void camera.animateZoom(DEFAULT_BOARD_ZOOM_SETTINGS.baseZoom, {
      durationMs: DEFAULT_BOARD_ZOOM_SETTINGS.zoomOutDurationMs,
      easing: 'easeOut',
    });
  }, [focusedZoom, isMovingWithCamera, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (!animationMove) {
      processedAnimationIdRef.current = null;
      if (!holdTokenSync) {
        setTokenCell(currentCell);
      }
      setActivePath(undefined);
      setTokenPathPosition(undefined);
      return;
    }
    if (processedAnimationIdRef.current === animationMove.id) {
      return;
    }
    processedAnimationIdRef.current = animationMove.id;

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    const movementEngine = createMovementEngine(movementSettings);

    const specialEntryCell = animationMove.entryCell ?? animationMove.fromCell;
    const tokenPathCells =
      animationMove.tokenPathCells
      ?? (animationMove.type && specialEntryCell !== animationMove.fromCell
        ? [animationMove.fromCell, specialEntryCell]
        : [animationMove.fromCell, animationMove.toCell]);
    const movementPlan = movementEngine.planPath(tokenPathCells);
    setTokenStepDurationMs(movementEngine.settings.stepDurationMs);
    const transitionPath =
      animationMove.pathPoints ??
      (animationMove.type
        ? getBoardTransitionPath(boardType, animationMove.type, specialEntryCell, animationMove.toCell)?.points
        : undefined);

    setPulseCell(animationMove.type ? specialEntryCell : animationMove.fromCell);
    setTokenCell(animationMove.fromCell);
    setTokenPathPosition(undefined);

    movementPlan.steps.forEach((step) => {
      const stepTimer = window.setTimeout(() => {
        setTokenCell(step.toCell);
      }, step.startAtMs);
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
      }, movementPlan.totalDurationMs + movementEngine.settings.snakeDelayMs);

      timersRef.current.push(pulseTimer, startPathTimer);
      return;
    }

    setPulseCell(null);
    setActivePath(undefined);
    const completeTimer = window.setTimeout(() => {
      onMoveAnimationComplete?.(animationMove.id);
    }, movementPlan.totalDurationMs);

    timersRef.current.push(completeTimer);
  }, [animationMove, boardType, holdTokenSync, movementSettings, onMoveAnimationComplete, currentCell]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
    };
  }, []);

  const tokenPosition = useMemo(
    () => mapCellToBoardPosition(boardType, tokenCell),
    [boardType, tokenCell],
  );
  const effectiveTokenPosition = tokenPathPosition ?? tokenPosition;

  useEffect(() => {
    if (!followModeRef.current) {
      return;
    }

    followPointRef.current = {
      x: (effectiveTokenPosition.xPercent / 100) * viewportSize.width,
      y: (effectiveTokenPosition.yPercent / 100) * viewportSize.height,
    };

    const camera = cameraEngineRef.current;
    camera.follow({
      id: 'token',
      point: {
        x: followPointRef.current.x,
        y: followPointRef.current.y,
      },
    });
  }, [effectiveTokenPosition.xPercent, effectiveTokenPosition.yPercent, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    followPointRef.current = {
      x: (effectiveTokenPosition.xPercent / 100) * viewportSize.width,
      y: (effectiveTokenPosition.yPercent / 100) * viewportSize.height,
    };
  }, [effectiveTokenPosition.xPercent, effectiveTokenPosition.yPercent, viewportSize.height, viewportSize.width]);

  const pulsePosition = pulseCell ? mapCellToBoardPosition(boardType, pulseCell) : undefined;
  const activeCellType = specialTransitions.get(currentCell);
  const shouldAnimateToken = Boolean(animationMove) && !tokenPathPosition;
  const snakeCarriesToken = activePath?.type === 'snake' && Boolean(tokenPathPosition);
  const passiveTokens = otherTokens.map((token) => ({
    ...token,
    position: mapCellToBoardPosition(boardType, token.cell),
  }));

  const toggleManualZoomAt = (worldPoint: { x: number; y: number }) => {
    const camera = cameraEngineRef.current;
    const isZoomedIn = cameraState.zoom > DEFAULT_BOARD_ZOOM_SETTINGS.baseZoom + 0.05;
    if (isMovingWithCamera) {
      return;
    }
    if (isZoomedIn) {
      void camera.animateZoom(DEFAULT_BOARD_ZOOM_SETTINGS.baseZoom, {
        durationMs: DEFAULT_BOARD_ZOOM_SETTINGS.zoomOutDurationMs,
        easing: 'easeOut',
        focusPoint: worldPoint,
      });
      return;
    }
    void camera.animateZoom(focusedZoom, {
      durationMs: DEFAULT_BOARD_ZOOM_SETTINGS.zoomInDurationMs,
      easing: 'easeOut',
      focusPoint: worldPoint,
    });
  };

  const queueSingleTapCellOpen = (
    worldPoint: { x: number; y: number },
    rect: DOMRect,
  ) => {
    if (disableCellSelect || !onCellSelect) {
      return;
    }
    const xPercent = (worldPoint.x / rect.width) * 100;
    const yPercent = (worldPoint.y / rect.height) * 100;
    const cell = resolveCellFromBoardPercent(boardType, { xPercent, yPercent });
    if (!cell) {
      return;
    }
    if (singleTapTimerRef.current !== null) {
      window.clearTimeout(singleTapTimerRef.current);
    }
    singleTapTimerRef.current = window.setTimeout(() => {
      onCellSelect(cell);
      singleTapTimerRef.current = null;
    }, DEFAULT_BOARD_ZOOM_SETTINGS.doubleTapWindowMs);
  };

  const handleBoardPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (dragState && dragState.pointerId === event.pointerId) {
      dragStateRef.current = null;
      if (dragState.moved) {
        return;
      }
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const worldPoint = cameraEngineRef.current.projectScreenToWorld({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    const now = Date.now();
    const previousTap = lastTapRef.current;
    const isDoubleTap = Boolean(
      previousTap
      && now - previousTap.time <= DEFAULT_BOARD_ZOOM_SETTINGS.doubleTapWindowMs
      && Math.hypot(worldPoint.x - previousTap.x, worldPoint.y - previousTap.y) <= DEFAULT_BOARD_ZOOM_SETTINGS.doubleTapDistancePx,
    );

    if (isDoubleTap) {
      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = null;
      toggleManualZoomAt(worldPoint);
      event.preventDefault();
      return;
    }

    lastTapRef.current = {
      time: now,
      x: worldPoint.x,
      y: worldPoint.y,
    };

    queueSingleTapCellOpen(worldPoint, rect);
  };

  const handleBoardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (followModeRef.current) {
      return;
    }
    event.preventDefault();
    dragStateRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBoardPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - dragState.lastX;
    const dy = event.clientY - dragState.lastY;
    dragState.lastX = event.clientX;
    dragState.lastY = event.clientY;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      dragState.moved = true;
      if (!followModeRef.current && cameraState.zoom > DEFAULT_BOARD_ZOOM_SETTINGS.baseZoom + 0.05) {
        cameraEngineRef.current.panBy({ x: dx, y: dy });
        const next = cameraEngineRef.current.getSnapshot();
        cameraSnapshotRef.current = next;
        setCameraState(next);
      }
    }
  };

  const handleBoardPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    dragStateRef.current = null;
  };

  return (
    <div
      className="relative w-full rounded-3xl p-0"
      style={{
        background: theme.boardBackground.canvasShellBackground,
        boxShadow: theme.boardBackground.canvasShellShadow,
      }}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        data-testid="lila-board-canvas"
        onPointerUp={handleBoardPointerUp}
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handleBoardPointerMove}
        onPointerCancel={handleBoardPointerCancel}
        onContextMenu={(event) => event.preventDefault()}
        style={{
          aspectRatio,
          background: theme.boardBackground.canvasFrameBackground,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
        ref={canvasRef}
      >
        <BoardSceneContainer camera={cameraState}>
          {!isBoardImageReady && (
            <img
              src={resolveAssetUrl(boardImageSelection.placeholderSrc)}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 block h-full w-full select-none object-cover"
              style={{
                filter: 'blur(8px)',
                opacity: 0.9,
                transform: 'scale(1.02)',
              }}
            />
          )}

          <picture>
            <source
              type="image/webp"
              srcSet={toResolvedSrcSet(boardImageSelection.webpSrcSet)}
              sizes={boardImageSelection.sizes}
            />
            <img
              src={activeBoardSrc ?? resolveAssetUrl(boardImageSelection.fallbackSrc)}
              srcSet={toResolvedSrcSet(boardImageSelection.pngSrcSet)}
              sizes={boardImageSelection.sizes}
              alt={boardType === 'full' ? 'Lila full board' : 'Lila short board'}
              className="block h-full w-full select-none object-cover transition-opacity duration-300"
              style={{
                opacity: isBoardImageReady ? 1 : 0,
                imageRendering: 'auto',
                filter: theme.boardBackground.boardImageFilter,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            />
          </picture>

          {activePath?.type && (
            <LilaPathAnimation
              key={`${activePath.id}-${boardType}`}
              boardType={boardType}
              fromCell={activePath.fromCell}
              toCell={activePath.toCell}
              type={activePath.type}
              points={activePath.pathPoints}
              timings={animationTimings}
              tokenColor={tokenColor ?? theme.token.defaultColor}
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
                backgroundColor: activePath?.type === 'arrow' ? theme.stairs.pulseFill : theme.snake.pulseFill,
                border: activePath?.type === 'arrow' ? theme.stairs.pulseBorder : theme.snake.pulseBorder,
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
                  ? theme.token.arrowCellGlow
                  : activeCellType === 'snake'
                    ? theme.token.snakeCellGlow
                    : theme.token.neutralGlow,
            }}
            animate={
              activeCellType
                ? { scale: [0.92, 1.12], opacity: [0.4, 0.95] }
                : { scale: [0.9, 1.05], opacity: [0.35, 0.7] }
            }
            transition={activeCellType ? specialCellGlowTransition : activeCellGlowTransition}
          />

          {!snakeCarriesToken && (
            <motion.div
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-stone-900 shadow-md"
              style={{
                left: `${effectiveTokenPosition.xPercent}%`,
                top: `${effectiveTokenPosition.yPercent}%`,
                backgroundColor: tokenColor ?? theme.token.defaultColor,
                borderColor: theme.token.borderColor,
                boxShadow:
                  activePath?.type === 'arrow'
                    ? theme.token.glowArrow
                    : activePath?.type === 'snake'
                      ? theme.token.glowSnake
                      : undefined,
              }}
              animate={{
                left: `${effectiveTokenPosition.xPercent}%`,
                top: `${effectiveTokenPosition.yPercent}%`,
                scale: activePath?.type ? [1, 1.08, 1] : 1,
              }}
              transition={
                shouldAnimateToken
                  ? {
                      ...tokenMoveTransition,
                      duration: tokenStepDurationMs / 1000,
                      ease: movementSettings.easing,
                    }
                  : { duration: 0 }
              }
              aria-label="token"
            />
          )}

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
        </BoardSceneContainer>

        {cameraState.zoom > 1.02 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: theme.layout.zoomModeGradient,
              opacity: Math.min(0.72, (cameraState.zoom - 1) * 0.8),
            }}
          />
        )}
      </div>
    </div>
  );
};
