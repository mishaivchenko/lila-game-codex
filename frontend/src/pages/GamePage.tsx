import chakrasRaw from '../content/chakras.json';
import { BOARD_DEFINITIONS } from '../content/boards';
import { useGameContext } from '../context/GameContext';
import { LilaBoard, type LilaTransition } from '../components/lila/LilaBoard';
import { Dice3D } from '../components/dice3d/Dice3D';
import { AnimationSettingsModal } from '../components/AnimationSettingsModal';
import { CellCoachModal } from '../components/CellCoachModal';
import { FinalScreen } from '../components/FinalScreen';
import { computeNextPosition } from '../domain/gameEngine';
import type { ChakraInfo, GameMove } from '../domain/types';
import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { formatMovePathWithEntry, getMovePresentation, resolveMoveType } from '../lib/lila/historyFormat';
import { getBoardTransitionPath } from '../lib/lila/boardProfiles';
import { buildStepwiseCellPath, resolveTransitionEntryCell } from '../lib/lila/moveVisualization';
import {
  DEFAULT_ANIMATION_TIMINGS,
  normalizeAnimationTimings,
  saveAnimationTimings,
} from '../lib/animations/animationTimingSettings';
import { FinishSessionDialog } from './game/components/FinishSessionDialog';
import { DeepRequestDialog } from './game/components/DeepRequestDialog';
import { GameStatusHeader } from './game/components/GameStatusHeader';
import { GameControlPanel } from './game/components/GameControlPanel';
import { useSimpleMultiplayer } from './game/useSimpleMultiplayer';
import { useBoardTheme } from '../theme';
import { GameBoardLayout } from '../ui/layout/GameBoardLayout';
import { createMovementEngine, DEFAULT_MOVEMENT_SETTINGS, normalizeMovementSettings } from '../engine/movement/MovementEngine';
import type {
  CoachMoveContext,
  PendingSimpleMove,
  SpecialFlowPhase,
  SpecialFlowState,
  TurnState,
} from './game/gamePageTypes';
import { SIMPLE_COLOR_HEX } from './game/gamePageTypes';

const chakras = chakrasRaw as ChakraInfo[];
export const GamePage = () => {
  const navigate = useNavigate();
  const {
    currentSession,
    performMove,
    finishSession,
    saveInsight,
    updateSessionRequest,
    resumeLastSession,
    loading,
    error,
  } = useGameContext();
  const [lastMove, setLastMove] = useState<GameMove | undefined>();
  const [showCoach, setShowCoach] = useState(false);
  const [showDeepRequestModal, setShowDeepRequestModal] = useState(false);
  const [deepRequestDraft, setDeepRequestDraft] = useState('');
  const [showHintInfo, setShowHintInfo] = useState(false);
  const [entryHint, setEntryHint] = useState<string | undefined>(undefined);
  const [diceRollToken, setDiceRollToken] = useState(0);
  const [diceRequestedValue, setDiceRequestedValue] = useState<number | undefined>(undefined);
  const [turnState, setTurnState] = useState<TurnState>('idle');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showAnimationSettings, setShowAnimationSettings] = useState(false);
  const [animationTimings, setAnimationTimings] = useState(DEFAULT_ANIMATION_TIMINGS);
  const [animationMove, setAnimationMove] = useState<LilaTransition | undefined>();
  const [activeModalCell, setActiveModalCell] = useState<number | undefined>(undefined);
  const [modalMoveContext, setModalMoveContext] = useState<CoachMoveContext | undefined>(undefined);
  const [specialFlow, setSpecialFlow] = useState<SpecialFlowState | undefined>(undefined);
  const [specialFlowPhase, setSpecialFlowPhase] = useState<SpecialFlowPhase>('idle');
  const pendingMoveIdRef = useRef<string | undefined>(undefined);
  const pendingMoveContextRef = useRef<CoachMoveContext | undefined>(undefined);
  const pendingEntryMoveIdRef = useRef<string | undefined>(undefined);
  const pendingEntryResultRef = useRef<'retry' | 'entered' | undefined>(undefined);
  const animationFallbackTimerRef = useRef<number | undefined>(undefined);
  const resumeAttemptedRef = useRef(false);
  const pendingSimpleMoveRef = useRef<PendingSimpleMove | undefined>(undefined);
  const {
    simplePlayers,
    activeSimplePlayer,
    activeSimplePlayerIndex,
    isSimpleMultiplayer,
    multiplayerFinished,
    commitPendingSimpleMove,
    resetSimpleMultiplayer,
  } = useSimpleMultiplayer({
    currentSession,
    updateSessionRequest,
  });
  const { tokenColorValue, animationSpeed } = useBoardTheme();

  const currentChakra = useMemo(() => {
    if (!currentSession) {
      return undefined;
    }
    return chakras.find(
      (chakra) => currentSession.currentCell >= chakra.rowStart && currentSession.currentCell <= chakra.rowEnd,
    );
  }, [currentSession]);

  useEffect(() => {
    if (!currentSession) {
      resetSimpleMultiplayer();
      return;
    }
    if (currentSession.request.isDeepEntry) {
      resetSimpleMultiplayer();
    }
  }, [currentSession, resetSimpleMultiplayer]);
  const board =
    currentSession
      ? (BOARD_DEFINITIONS[currentSession.boardType] ?? BOARD_DEFINITIONS.full)
      : BOARD_DEFINITIONS.full;
  const animationSpeedMultiplier = animationSpeed === 'slow' ? 1.3 : animationSpeed === 'fast' ? 0.8 : 1;
  const effectiveAnimationTimings = useMemo(
    () => ({
      tokenMoveDurationMs: Math.round(animationTimings.tokenMoveDurationMs * animationSpeedMultiplier),
      pathDrawDurationMs: Math.round(animationTimings.pathDrawDurationMs * animationSpeedMultiplier),
      pathTravelDurationMs: Math.round(animationTimings.pathTravelDurationMs * animationSpeedMultiplier),
      pathPostHoldMs: Math.round(animationTimings.pathPostHoldMs * animationSpeedMultiplier),
      pathFadeOutMs: Math.round(animationTimings.pathFadeOutMs * animationSpeedMultiplier),
      cardOpenDelayMs: Math.round(animationTimings.cardOpenDelayMs * animationSpeedMultiplier),
    }),
    [animationSpeedMultiplier, animationTimings],
  );
  const movementSettings = useMemo(
    () =>
      normalizeMovementSettings({
        stepDurationMs: Math.round(DEFAULT_MOVEMENT_SETTINGS.stepDurationMs * animationSpeedMultiplier),
        stepPauseMs: Math.round(DEFAULT_MOVEMENT_SETTINGS.stepPauseMs * animationSpeedMultiplier),
        snakeDelayMs: Math.round(DEFAULT_MOVEMENT_SETTINGS.snakeDelayMs * animationSpeedMultiplier),
        modalOpenDelayMs: Math.round(DEFAULT_MOVEMENT_SETTINGS.modalOpenDelayMs * animationSpeedMultiplier),
      }),
    [animationSpeedMultiplier],
  );
  const displayCurrentCell = activeSimplePlayer?.currentCell ?? currentSession?.currentCell ?? 1;

  const safeCurrentCell = Math.min(
    Math.max(displayCurrentCell || 1, 1),
    board.maxCell,
  );
  const modalCellNumber = Math.min(
    Math.max(activeModalCell ?? safeCurrentCell, 1),
    board.maxCell,
  );
  const cellContent = board.cells[modalCellNumber - 1] ?? board.cells[0];
  const isAnimatingMove = turnState === 'animating';
  const lastMoveType = lastMove ? resolveMoveType(lastMove) : 'normal';
  const lastMovePresentation = getMovePresentation(lastMoveType);
  const openCoachCard = useCallback(
    (
      cellNumber: number,
      context?: CoachMoveContext,
      delayMs: number = movementSettings.modalOpenDelayMs,
    ) => {
      setActiveModalCell(Math.min(Math.max(cellNumber, 1), board.maxCell));
      setModalMoveContext(context);

      if (delayMs <= 0) {
        setShowCoach(true);
        return;
      }

      window.setTimeout(() => {
        setShowCoach(true);
      }, delayMs);
    },
    [board.maxCell, movementSettings.modalOpenDelayMs],
  );

  const resetSpecialFlow = useCallback(() => {
    setSpecialFlow(undefined);
    setSpecialFlowPhase('idle');
  }, []);

  const buildPathToEntryCell = useCallback(
    (path: number[], entryCell: number, fromCell: number): number[] => {
      const entryIndex = path.lastIndexOf(entryCell);
      if (entryIndex >= 1) {
        return path.slice(0, entryIndex + 1);
      }
      return [fromCell, entryCell];
    },
    [],
  );

  const onMoveAnimationComplete = useCallback((moveId: string) => {
    if (animationFallbackTimerRef.current !== undefined) {
      window.clearTimeout(animationFallbackTimerRef.current);
      animationFallbackTimerRef.current = undefined;
    }
    if (pendingMoveIdRef.current !== moveId) {
      return;
    }

    if (specialFlow) {
      if (specialFlowPhase === 'entry-animation' && moveId === specialFlow.moveId) {
        setAnimationMove(undefined);
        setSpecialFlowPhase('entry-card');
        setTurnState('animating');
        openCoachCard(
          specialFlow.headCell,
          {
            fromCell: specialFlow.headCell,
            toCell: specialFlow.headCell,
            type: 'normal',
            pathLabel: `${specialFlow.headCell}`,
          },
        );
        return;
      }

      const specialMoveId = `${specialFlow.moveId}-special`;
      if (specialFlowPhase === 'special-animation' && moveId === specialMoveId) {
        if (pendingSimpleMoveRef.current?.moveId === specialFlow.moveId) {
          commitPendingSimpleMove(pendingSimpleMoveRef.current);
          pendingSimpleMoveRef.current = undefined;
        }
        setAnimationMove(undefined);
        setSpecialFlowPhase('target-card');
        setTurnState('animating');
        openCoachCard(
          specialFlow.tailCell,
          pendingMoveContextRef.current,
        );
        return;
      }
    }

    if (pendingSimpleMoveRef.current && pendingSimpleMoveRef.current.moveId === moveId) {
      const pending = pendingSimpleMoveRef.current;
      commitPendingSimpleMove(pending);
      pendingSimpleMoveRef.current = undefined;
      setTurnState('idle');
      setAnimationMove(undefined);
      openCoachCard(
        pending.toCell,
        pendingMoveContextRef.current,
      );
      pendingMoveContextRef.current = undefined;
      return;
    }

    if (pendingEntryMoveIdRef.current === moveId) {
      const result = pendingEntryResultRef.current;
      setTurnState('idle');
      setAnimationMove(undefined);
      pendingEntryMoveIdRef.current = undefined;
      pendingEntryResultRef.current = undefined;

      if (result === 'retry') {
        setShowDeepRequestModal(true);
      }
      if (result === 'entered') {
        setEntryHint('Ви увійшли в гру. Наступний кидок почне рух по полю.');
      }
      return;
    }

    setTurnState('idle');
    openCoachCard(
      pendingMoveContextRef.current?.toCell ?? safeCurrentCell,
      pendingMoveContextRef.current,
    );
    pendingMoveContextRef.current = undefined;
    setAnimationMove(undefined);
  }, [commitPendingSimpleMove, openCoachCard, safeCurrentCell, specialFlow, specialFlowPhase]);

  useEffect(() => {
    setDeepRequestDraft(currentSession?.request.simpleRequest ?? '');
  }, [currentSession]);

  useEffect(() => {
    if (currentSession || resumeAttemptedRef.current) {
      return;
    }
    resumeAttemptedRef.current = true;
    void resumeLastSession();
  }, [currentSession, resumeLastSession]);

  useEffect(() => {
    return () => {
      if (animationFallbackTimerRef.current !== undefined) {
        window.clearTimeout(animationFallbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    saveAnimationTimings(animationTimings);
  }, [animationTimings]);

  if (!currentSession) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
        <p className="text-sm text-stone-700">
          {loading
            ? 'Відновлюємо останню сесію...'
            : 'Немає активної сесії. Поверніться в налаштування.'}
        </p>
        {!loading && (
          <Link to="/setup" className="mt-3 inline-block text-sm text-[#8d6b5a]">До налаштувань</Link>
        )}
      </main>
    );
  }

  const applyRolledValue = async (diceValue: number): Promise<void> => {
    if (isAnimatingMove || multiplayerFinished || currentSession.finished || currentSession.sessionStatus === 'completed') {
      return;
    }

    setShowCoach(false);
    setShowDeepRequestModal(false);
    setEntryHint(undefined);

    if (isSimpleMultiplayer && activeSimplePlayer) {
      const computed = computeNextPosition(
        activeSimplePlayer.currentCell,
        diceValue,
        board,
        activeSimplePlayer.hasEnteredGame,
      );
      const moveId = `simple-${activeSimplePlayer.id}-${Date.now()}`;
      setLastMove({
        id: moveId,
        sessionId: currentSession.id,
        moveNumber: 0,
        fromCell: computed.fromCell,
        toCell: computed.toCell,
        dice: computed.dice,
        moveType:
          computed.snakeOrArrow === 'snake'
            ? 'snake'
            : computed.snakeOrArrow === 'arrow'
              ? 'ladder'
              : 'normal',
        snakeOrArrow: computed.snakeOrArrow,
        createdAt: new Date().toISOString(),
      });
      setTurnState('animating');
      pendingMoveIdRef.current = moveId;
      pendingMoveContextRef.current = {
        fromCell: computed.fromCell,
        toCell: computed.toCell,
        type:
          computed.snakeOrArrow === 'snake'
            ? 'snake'
            : computed.snakeOrArrow === 'arrow'
              ? 'ladder'
              : 'normal',
        pathLabel: `${computed.fromCell} → ${computed.toCell}`,
      };
      pendingSimpleMoveRef.current = {
        moveId,
        playerId: activeSimplePlayer.id,
        fromCell: computed.fromCell,
        toCell: computed.toCell,
        dice: computed.dice,
        moveType:
          computed.snakeOrArrow === 'snake'
            ? 'snake'
            : computed.snakeOrArrow === 'arrow'
              ? 'ladder'
              : 'normal',
        snakeOrArrow: computed.snakeOrArrow,
        finished: computed.finished,
        hasEnteredGame: computed.hasEnteredGame,
        createdAt: new Date().toISOString(),
      };
      const entryCell = resolveTransitionEntryCell(
        computed.fromCell,
        computed.dice,
        board,
        computed.snakeOrArrow,
        computed.toCell,
      );
      const transitionPath =
        computed.snakeOrArrow && entryCell
          ? getBoardTransitionPath(currentSession.boardType, computed.snakeOrArrow, entryCell, computed.toCell)?.points
          : undefined;
      const tokenPathCells = buildStepwiseCellPath(computed.fromCell, computed.dice, board.maxCell);
      const isSpecialFlow =
        (computed.snakeOrArrow === 'snake' || computed.snakeOrArrow === 'arrow')
        && Boolean(entryCell)
        && Boolean(transitionPath?.length)
        && entryCell !== computed.toCell;
      if (isSpecialFlow) {
        const entryTokenPath = buildPathToEntryCell(tokenPathCells, entryCell!, computed.fromCell);
        setSpecialFlow({
          moveId,
          type: computed.snakeOrArrow!,
          headCell: entryCell!,
          tailCell: computed.toCell,
          pathPoints: transitionPath,
        });
        setSpecialFlowPhase('entry-animation');
        setAnimationMove({
          id: moveId,
          fromCell: computed.fromCell,
          toCell: entryCell!,
          type: null,
          tokenPathCells: entryTokenPath,
        });
        return;
      }
      resetSpecialFlow();
      setAnimationMove({
        id: moveId,
        fromCell: computed.fromCell,
        toCell: computed.toCell,
        type: computed.snakeOrArrow ?? null,
        entryCell,
        pathPoints: transitionPath,
        tokenPathCells,
      });
      return;
    }

    const move = await performMove(diceValue);
    if (!move) {
      return;
    }

    const isDeepEntryRoll = currentSession.request.isDeepEntry && !currentSession.hasEnteredGame;
    setLastMove(move);
    setTurnState('animating');
    pendingMoveContextRef.current = {
      fromCell: move.fromCell,
      toCell: move.toCell,
      type:
        move.moveType ??
        (move.snakeOrArrow === 'snake'
          ? 'snake'
          : move.snakeOrArrow === 'arrow'
            ? 'ladder'
            : 'normal'),
      pathLabel: formatMovePathWithEntry(move, board.maxCell),
    };
    pendingMoveIdRef.current = move.id;
    pendingEntryMoveIdRef.current = undefined;
    pendingEntryResultRef.current = undefined;

    if (isDeepEntryRoll) {
      pendingEntryMoveIdRef.current = move.id;
      pendingEntryResultRef.current = move.dice === 6 ? 'entered' : 'retry';
    }
    const entryCell = resolveTransitionEntryCell(
      move.fromCell,
      move.dice,
      board,
      move.snakeOrArrow ?? null,
      move.toCell,
    );
    const transitionPath =
      move.snakeOrArrow && entryCell
        ? getBoardTransitionPath(currentSession.boardType, move.snakeOrArrow, entryCell, move.toCell)?.points
        : undefined;
    const tokenPathCells = buildStepwiseCellPath(move.fromCell, move.dice, board.maxCell);
    const isSpecialFlow =
      (move.snakeOrArrow === 'snake' || move.snakeOrArrow === 'arrow')
      && Boolean(entryCell)
      && Boolean(transitionPath?.length)
      && entryCell !== move.toCell;
    let movementPathForPlan = tokenPathCells;
    if (isSpecialFlow) {
      const entryTokenPath = buildPathToEntryCell(tokenPathCells, entryCell!, move.fromCell);
      movementPathForPlan = entryTokenPath;
      setSpecialFlow({
        moveId: move.id,
        type: move.snakeOrArrow!,
        headCell: entryCell!,
        tailCell: move.toCell,
        pathPoints: transitionPath,
      });
      setSpecialFlowPhase('entry-animation');
      setAnimationMove({
        id: move.id,
        fromCell: move.fromCell,
        toCell: entryCell!,
        type: null,
        tokenPathCells: entryTokenPath,
      });
    } else {
      resetSpecialFlow();

      setAnimationMove({
        id: move.id,
        fromCell: move.fromCell,
        toCell: move.toCell,
        type: move.snakeOrArrow ?? null,
        entryCell,
        pathPoints: transitionPath,
        tokenPathCells,
      });
    }

    const movementPlan = createMovementEngine(movementSettings).planPath(movementPathForPlan);
    const specialDuration =
      move.snakeOrArrow && !isSpecialFlow
        ? movementSettings.snakeDelayMs
          + effectiveAnimationTimings.pathDrawDurationMs
          + effectiveAnimationTimings.pathTravelDurationMs
          + effectiveAnimationTimings.pathPostHoldMs
          + effectiveAnimationTimings.pathFadeOutMs
        : 0;
    const fallbackMs = movementPlan.totalDurationMs + specialDuration + movementSettings.modalOpenDelayMs + 220;
    animationFallbackTimerRef.current = window.setTimeout(() => {
      if (pendingMoveIdRef.current !== move.id) {
        return;
      }
      if (isSpecialFlow) {
        setAnimationMove(undefined);
        setSpecialFlowPhase('entry-card');
        setTurnState('animating');
        openCoachCard(
          entryCell!,
          {
            fromCell: entryCell!,
            toCell: entryCell!,
            type: 'normal',
            pathLabel: `${entryCell!}`,
          },
        );
        return;
      }
      setTurnState('idle');
      openCoachCard(
        pendingMoveContextRef.current?.toCell ?? safeCurrentCell,
        pendingMoveContextRef.current,
      );
      pendingMoveContextRef.current = undefined;
      setAnimationMove(undefined);
    }, fallbackMs);
  };

  const triggerDiceRoll = (requestedValue?: number): void => {
    if (turnState !== 'idle' || multiplayerFinished || currentSession.finished || currentSession.sessionStatus === 'completed') {
      return;
    }
    setShowCoach(false);
    setDiceRequestedValue(requestedValue);
    setTurnState('rolling');
    setDiceRollToken((prev) => prev + 1);
  };

  const closeCoachModal = useCallback(() => {
    if (specialFlow?.type && specialFlowPhase === 'entry-card' && activeModalCell === specialFlow.headCell) {
      const specialMoveId = `${specialFlow.moveId}-special`;
      pendingMoveIdRef.current = specialMoveId;
      setShowCoach(false);
      setModalMoveContext(undefined);
      setSpecialFlowPhase('special-animation');
      setTurnState('animating');
      setAnimationMove({
        id: specialMoveId,
        fromCell: specialFlow.headCell,
        toCell: specialFlow.tailCell,
        type: specialFlow.type,
        entryCell: specialFlow.headCell,
        pathPoints: specialFlow.pathPoints,
        tokenPathCells: [specialFlow.headCell],
      });
      return;
    }

    if (specialFlow?.type && specialFlowPhase === 'target-card' && activeModalCell === specialFlow.tailCell) {
      setTurnState('idle');
      pendingMoveContextRef.current = undefined;
      resetSpecialFlow();
    }
    setShowCoach(false);
    setModalMoveContext(undefined);
  }, [activeModalCell, resetSpecialFlow, specialFlow, specialFlowPhase]);

  const saveCoachModal = useCallback((text: string) => {
    void saveInsight(modalCellNumber, text).then(() => {
      closeCoachModal();
    });
  }, [closeCoachModal, modalCellNumber, saveInsight]);

  const handleBoardCellSelect = useCallback((cellNumber: number) => {
    if (turnState !== 'idle') {
      return;
    }

    setActiveModalCell(cellNumber);
    setModalMoveContext(undefined);
    setShowCoach(true);
  }, [turnState]);

  if ((!isSimpleMultiplayer && currentSession.finished) || multiplayerFinished) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
        <FinalScreen onViewPath={() => navigate('/history')} onStartNew={() => navigate('/setup')} />
      </main>
    );
  }

  return (
    <>
      <GameBoardLayout
      header={(
        <GameStatusHeader
          isSimpleMultiplayer={isSimpleMultiplayer}
          activeSimplePlayerName={activeSimplePlayer?.name}
          safeCurrentCell={safeCurrentCell}
          showHintInfo={showHintInfo}
          onToggleHintInfo={() => setShowHintInfo((prev) => !prev)}
          simplePlayers={simplePlayers}
          activeSimplePlayerIndex={activeSimplePlayerIndex}
          simpleColorHex={SIMPLE_COLOR_HEX}
          currentChakra={currentChakra}
          isDeepEntryPending={currentSession.request.isDeepEntry && !currentSession.hasEnteredGame}
          entryHint={entryHint}
        />
      )}
      board={(
        <LilaBoard
          board={board}
          currentCell={safeCurrentCell}
          tokenColor={activeSimplePlayer ? SIMPLE_COLOR_HEX[activeSimplePlayer.color] ?? '#1f2937' : tokenColorValue}
          otherTokens={
            isSimpleMultiplayer
              ? simplePlayers
                  .filter((player) => player.id !== activeSimplePlayer?.id)
                  .map((player) => ({
                    id: player.id,
                    cell: player.currentCell,
                    color: SIMPLE_COLOR_HEX[player.color] ?? '#6b7280',
                  }))
              : undefined
          }
          animationMove={animationMove}
          animationTimings={effectiveAnimationTimings}
          movementSettings={movementSettings}
          onMoveAnimationComplete={onMoveAnimationComplete}
          onCellSelect={handleBoardCellSelect}
          disableCellSelect={turnState !== 'idle'}
          holdTokenSync={turnState !== 'idle'}
        />
      )}
      controls={(
        <GameControlPanel
          lastMove={lastMove}
          boardMaxCell={board.maxCell}
          isSimpleMultiplayer={isSimpleMultiplayer}
          error={error}
          turnState={turnState}
          lastMoveType={lastMoveType}
          lastMovePresentation={lastMovePresentation}
          onRoll={() => triggerDiceRoll()}
          onOpenFinishConfirm={() => setShowFinishConfirm(true)}
          onOpenAnimationSettings={() => setShowAnimationSettings(true)}
        />
      )}
      sideContent={undefined}
      />

      <AnimatePresence>
        <FinishSessionDialog
          open={showFinishConfirm}
          onConfirm={() => {
            void finishSession().then(() => setShowFinishConfirm(false));
          }}
          onCancel={() => setShowFinishConfirm(false)}
        />
        <DeepRequestDialog
          open={showDeepRequestModal}
          value={deepRequestDraft}
          onChange={setDeepRequestDraft}
          onSave={() => {
            void updateSessionRequest(deepRequestDraft).then(() => {
              setShowDeepRequestModal(false);
            });
          }}
          onClose={() => setShowDeepRequestModal(false)}
        />
        {showCoach && (
          <CellCoachModal
            cellNumber={modalCellNumber}
            cellContent={cellContent}
            depth={currentSession.settings.depth}
            moveContext={modalMoveContext}
            onSave={saveCoachModal}
            onSkip={closeCoachModal}
            onClose={closeCoachModal}
          />
        )}
        <AnimationSettingsModal
          open={showAnimationSettings}
          settings={animationTimings}
          onChange={(next) => setAnimationTimings(normalizeAnimationTimings(next))}
          onReset={() => setAnimationTimings(DEFAULT_ANIMATION_TIMINGS)}
          onClose={() => setShowAnimationSettings(false)}
        />
      </AnimatePresence>

      <Dice3D
        rollToken={diceRollToken}
        requestedValue={diceRequestedValue}
        onResult={(value) => {
          void applyRolledValue(value);
        }}
        onFinished={() => {
          setTurnState((prev) => (prev === 'rolling' ? 'idle' : prev));
          setDiceRequestedValue(undefined);
        }}
      />
    </>
  );
};
