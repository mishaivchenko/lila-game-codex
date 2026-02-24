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
import { DeepModeCard } from '../features/deep-mode';
import { TelegramRoomsPanel } from '../features/telegram';
import { FinishSessionDialog } from './game/components/FinishSessionDialog';
import { DeepRequestDialog } from './game/components/DeepRequestDialog';
import { GameStatusHeader } from './game/components/GameStatusHeader';
import { GameControlPanel } from './game/components/GameControlPanel';
import { useSimpleMultiplayer } from './game/useSimpleMultiplayer';
import type {
  CoachMoveContext,
  ModalMode,
  PendingSimpleMove,
  SnakeFlowPhase,
  SnakeFlowState,
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
  const [snakeFlowPhase, setSnakeFlowPhase] = useState<SnakeFlowPhase>('idle');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showAnimationSettings, setShowAnimationSettings] = useState(false);
  const [animationTimings, setAnimationTimings] = useState(DEFAULT_ANIMATION_TIMINGS);
  const [animationMove, setAnimationMove] = useState<LilaTransition | undefined>();
  const [activeModalCell, setActiveModalCell] = useState<number | undefined>(undefined);
  const [modalMoveContext, setModalMoveContext] = useState<CoachMoveContext | undefined>(undefined);
  const [modalMode, setModalMode] = useState<ModalMode>('inspect');
  const pendingMoveIdRef = useRef<string | undefined>(undefined);
  const pendingMoveContextRef = useRef<CoachMoveContext | undefined>(undefined);
  const pendingEntryMoveIdRef = useRef<string | undefined>(undefined);
  const pendingEntryResultRef = useRef<'retry' | 'entered' | undefined>(undefined);
  const pendingSnakeHeadMoveIdRef = useRef<string | undefined>(undefined);
  const pendingSnakeTailMoveIdRef = useRef<string | undefined>(undefined);
  const snakeFlowRef = useRef<SnakeFlowState | undefined>(undefined);
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
      snakeFlowRef.current = undefined;
      pendingSnakeHeadMoveIdRef.current = undefined;
      pendingSnakeTailMoveIdRef.current = undefined;
      setSnakeFlowPhase('idle');
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
      mode: ModalMode = 'move',
      delayMs: number = animationTimings.cardOpenDelayMs,
    ) => {
      setActiveModalCell(Math.min(Math.max(cellNumber, 1), board.maxCell));
      setModalMoveContext(context);
      setModalMode(mode);

      if (delayMs <= 0) {
        setShowCoach(true);
        return;
      }

      window.setTimeout(() => {
        setShowCoach(true);
      }, delayMs);
    },
    [animationTimings.cardOpenDelayMs, board.maxCell],
  );

  const onMoveAnimationComplete = useCallback((moveId: string) => {
    if (animationFallbackTimerRef.current !== undefined) {
      window.clearTimeout(animationFallbackTimerRef.current);
      animationFallbackTimerRef.current = undefined;
    }
    if (pendingMoveIdRef.current !== moveId) {
      return;
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
        'move',
      );
      pendingMoveContextRef.current = undefined;
      return;
    }

    if (pendingSnakeHeadMoveIdRef.current === moveId && snakeFlowRef.current) {
      pendingSnakeHeadMoveIdRef.current = undefined;
      const flow = snakeFlowRef.current;
      setAnimationMove(undefined);
      setSnakeFlowPhase('head-card');
      openCoachCard(
        flow.headCell,
        {
          fromCell: lastMove?.fromCell ?? flow.headCell,
          toCell: flow.headCell,
          type: 'snake',
          pathLabel: `${lastMove?.fromCell ?? flow.headCell} → ${flow.headCell}`,
        },
        'snake-head',
        0,
      );
      return;
    }

    if (pendingSnakeTailMoveIdRef.current === moveId && snakeFlowRef.current) {
      pendingSnakeTailMoveIdRef.current = undefined;
      const flow = snakeFlowRef.current;
      setAnimationMove(undefined);
      setSnakeFlowPhase('tail-card');
      openCoachCard(
        flow.tailCell,
        {
          fromCell: flow.headCell,
          toCell: flow.tailCell,
          type: 'snake',
          pathLabel: `${flow.headCell} ↘ ${flow.tailCell}`,
        },
        'snake-tail',
        0,
      );
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
      'move',
    );
    pendingMoveContextRef.current = undefined;
    setAnimationMove(undefined);
  }, [commitPendingSimpleMove, lastMove?.fromCell, openCoachCard, safeCurrentCell]);

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
    pendingSnakeHeadMoveIdRef.current = undefined;
    pendingSnakeTailMoveIdRef.current = undefined;
    snakeFlowRef.current = undefined;
    setSnakeFlowPhase('idle');

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

    if (!isDeepEntryRoll && move.snakeOrArrow === 'snake' && entryCell) {
      const toHeadMoveId = `${move.id}-head`;
      snakeFlowRef.current = {
        moveId: move.id,
        headCell: entryCell,
        tailCell: move.toCell,
        pathPoints: transitionPath,
      };
      pendingMoveIdRef.current = toHeadMoveId;
      pendingSnakeHeadMoveIdRef.current = toHeadMoveId;
      setAnimationMove({
        id: toHeadMoveId,
        fromCell: move.fromCell,
        toCell: entryCell,
        type: null,
        tokenPathCells,
      });
      return;
    }

    setAnimationMove({
      id: move.id,
      fromCell: move.fromCell,
      toCell: move.toCell,
      type: move.snakeOrArrow ?? null,
      entryCell,
      pathPoints: transitionPath,
      tokenPathCells,
    });

    if (!isDeepEntryRoll && move.snakeOrArrow !== 'snake') {
      const specialDuration =
        move.snakeOrArrow
          ? animationTimings.pathTravelDurationMs + animationTimings.pathPostHoldMs + animationTimings.pathFadeOutMs
          : 0;
      const fallbackMs = animationTimings.tokenMoveDurationMs + specialDuration + animationTimings.cardOpenDelayMs;
      animationFallbackTimerRef.current = window.setTimeout(() => {
        if (pendingMoveIdRef.current !== move.id) {
          return;
        }
        setTurnState('idle');
        openCoachCard(
          pendingMoveContextRef.current?.toCell ?? safeCurrentCell,
          pendingMoveContextRef.current,
          'move',
        );
        pendingMoveContextRef.current = undefined;
        setAnimationMove(undefined);
      }, fallbackMs);
    }
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
    setShowCoach(false);
    setModalMoveContext(undefined);

    if (modalMode === 'snake-head' && snakeFlowRef.current) {
      const flow = snakeFlowRef.current;
      const tailMoveId = `${flow.moveId}-tail`;
      pendingMoveIdRef.current = tailMoveId;
      pendingSnakeTailMoveIdRef.current = tailMoveId;
      setSnakeFlowPhase('tail-animation');
      setAnimationMove({
        id: tailMoveId,
        fromCell: flow.headCell,
        toCell: flow.tailCell,
        type: 'snake',
        entryCell: flow.headCell,
        pathPoints: flow.pathPoints,
        tokenPathCells: [flow.headCell, flow.headCell],
      });
      return;
    }

    if (modalMode === 'snake-tail') {
      setSnakeFlowPhase('idle');
      snakeFlowRef.current = undefined;
      pendingSnakeTailMoveIdRef.current = undefined;
      pendingSnakeHeadMoveIdRef.current = undefined;
      pendingMoveIdRef.current = undefined;
      setTurnState('idle');
    }
  }, [modalMode]);

  const saveCoachModal = useCallback((text: string) => {
    void saveInsight(modalCellNumber, text).then(() => {
      closeCoachModal();
    });
  }, [closeCoachModal, modalCellNumber, saveInsight]);

  const handleBoardCellSelect = useCallback((cellNumber: number) => {
    if (turnState !== 'idle' || snakeFlowPhase !== 'idle') {
      return;
    }

    setActiveModalCell(cellNumber);
    setModalMoveContext(undefined);
    setModalMode('inspect');
    setShowCoach(true);
  }, [snakeFlowPhase, turnState]);

  if ((!isSimpleMultiplayer && currentSession.finished) || multiplayerFinished) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
        <FinalScreen onViewPath={() => navigate('/history')} onStartNew={() => navigate('/setup')} />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[var(--lila-bg-main)] px-4 py-5">
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

      <LilaBoard
        board={board}
        currentCell={safeCurrentCell}
        tokenColor={activeSimplePlayer ? SIMPLE_COLOR_HEX[activeSimplePlayer.color] ?? '#1f2937' : undefined}
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
        animationTimings={animationTimings}
        onMoveAnimationComplete={onMoveAnimationComplete}
        onCellSelect={handleBoardCellSelect}
        disableCellSelect={turnState !== 'idle' || snakeFlowPhase !== 'idle'}
        holdTokenSync={turnState !== 'idle'}
      />

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

      <section className="mt-4">
        <DeepModeCard />
      </section>

      <section className="mt-4">
        <TelegramRoomsPanel />
      </section>

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
    </main>
  );
};
