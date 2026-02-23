import chakrasRaw from '../content/chakras.json';
import { BOARD_DEFINITIONS } from '../content/boards';
import { useGameContext } from '../context/GameContext';
import { LilaBoard, type LilaTransition } from '../components/lila/LilaBoard';
import { Dice } from '../components/Dice';
import { Dice3D } from '../components/dice3d/Dice3D';
import { ChakraNotification } from '../components/ChakraNotification';
import { CellCoachModal } from '../components/CellCoachModal';
import { FinalScreen } from '../components/FinalScreen';
import { computeNextPosition } from '../domain/gameEngine';
import type { ChakraInfo, GameMove } from '../domain/types';
import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { buttonHoverScale, buttonTapScale } from '../lib/animations/lilaMotion';
import { formatMovePath, getMovePresentation, resolveMoveType } from '../lib/lila/historyFormat';

const chakras = chakrasRaw as ChakraInfo[];
const SIMPLE_COLOR_HEX: Record<string, string> = {
  червоний: '#ef4444',
  помаранчевий: '#f97316',
  жовтий: '#eab308',
  зелений: '#10b981',
  синій: '#3b82f6',
  фіолетовий: '#8b5cf6',
  рожевий: '#ec4899',
};

interface SimplePlayerState {
  id: string;
  name: string;
  request: string;
  color: string;
  currentCell: number;
  hasEnteredGame: boolean;
  finished: boolean;
}

interface SimplePlayerHistoryEntry {
  fromCell: number;
  toCell: number;
  dice: number;
  moveType: 'normal' | 'snake' | 'ladder';
  snakeOrArrow: 'snake' | 'arrow' | null;
  createdAt: string;
}

interface SimpleMultiplayerPayload {
  players: Array<{
    id: string;
    name: string;
    request: string;
    color: string;
    currentCell: number;
    hasEnteredGame: boolean;
    finished: boolean;
  }>;
  historyByPlayer: Record<string, SimplePlayerHistoryEntry[]>;
}

type TurnState = 'idle' | 'rolling' | 'animating';

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
  const [simplePlayers, setSimplePlayers] = useState<SimplePlayerState[]>([]);
  const [activeSimplePlayerIndex, setActiveSimplePlayerIndex] = useState(0);
  const [diceRollToken, setDiceRollToken] = useState(0);
  const [diceRequestedValue, setDiceRequestedValue] = useState<number | undefined>(undefined);
  const [turnState, setTurnState] = useState<TurnState>('idle');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [animationMove, setAnimationMove] = useState<LilaTransition | undefined>();
  const pendingMoveIdRef = useRef<string | undefined>(undefined);
  const pendingModalCellRef = useRef<number | undefined>(undefined);
  const pendingEntryMoveIdRef = useRef<string | undefined>(undefined);
  const pendingEntryResultRef = useRef<'retry' | 'entered' | undefined>(undefined);
  const multiplayerInitializedSessionIdRef = useRef<string | undefined>(undefined);
  const resumeAttemptedRef = useRef(false);
  const pendingSimpleMoveRef = useRef<{
    moveId: string;
    playerId: string;
    fromCell: number;
    toCell: number;
    dice: number;
    moveType: 'normal' | 'snake' | 'ladder';
    snakeOrArrow: 'snake' | 'arrow' | null;
    finished: boolean;
    hasEnteredGame: boolean;
    createdAt: string;
  } | undefined>(undefined);
  const simpleHistoryByPlayerRef = useRef<Record<string, SimplePlayerHistoryEntry[]>>({});

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
      setSimplePlayers([]);
      simpleHistoryByPlayerRef.current = {};
      multiplayerInitializedSessionIdRef.current = undefined;
      return;
    }
    if (currentSession.request.isDeepEntry) {
      setSimplePlayers([]);
      simpleHistoryByPlayerRef.current = {};
      multiplayerInitializedSessionIdRef.current = undefined;
      return;
    }

    try {
      const parsed = JSON.parse(currentSession.request.question ?? '[]');
      const parsedPlayers = Array.isArray(parsed) ? parsed : parsed?.players;
      if (!Array.isArray(parsedPlayers)) {
        setSimplePlayers([]);
        simpleHistoryByPlayerRef.current = {};
        return;
      }
      const players = parsedPlayers
        .map((item) => ({
          id: String(item.id ?? `simple-${Date.now()}-${Math.random()}`),
          name: String(item.name ?? 'Учасник'),
          request: String(item.request ?? ''),
          color: String(item.color ?? 'синій'),
          currentCell: Number(item.currentCell ?? 1),
          hasEnteredGame: Boolean(item.hasEnteredGame ?? true),
          finished: Boolean(item.finished ?? false),
        }))
        .slice(0, 4);
      const parsedHistory =
        parsed && !Array.isArray(parsed) && typeof parsed === 'object' && parsed.historyByPlayer
          ? (parsed.historyByPlayer as Record<string, SimplePlayerHistoryEntry[]>)
          : {};
      const normalizedHistory = Object.fromEntries(
        Object.entries(parsedHistory).map(([playerId, entries]) => [
          playerId,
          entries.map((entry) => ({
            ...entry,
            moveType:
              entry.moveType ??
              (entry.snakeOrArrow === 'snake'
                ? 'snake'
                : entry.snakeOrArrow === 'arrow'
                  ? 'ladder'
                  : 'normal'),
          })),
        ]),
      ) as Record<string, SimplePlayerHistoryEntry[]>;
      simpleHistoryByPlayerRef.current = normalizedHistory;

      // Initialize multiplayer state only once per session, otherwise we keep runtime turn order.
      if (multiplayerInitializedSessionIdRef.current !== currentSession.id) {
        setSimplePlayers(players);
        setActiveSimplePlayerIndex(0);
        multiplayerInitializedSessionIdRef.current = currentSession.id;
      }
    } catch {
      setSimplePlayers([]);
      simpleHistoryByPlayerRef.current = {};
      multiplayerInitializedSessionIdRef.current = undefined;
    }
  }, [currentSession]);

  const isSimpleMultiplayer = Boolean(currentSession && !currentSession.request.isDeepEntry && simplePlayers.length > 1);
  const activeSimplePlayer = isSimpleMultiplayer ? simplePlayers[activeSimplePlayerIndex] : undefined;
  const multiplayerFinished =
    isSimpleMultiplayer && simplePlayers.length > 0 && simplePlayers.every((player) => player.finished);
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
    Math.max(pendingModalCellRef.current ?? safeCurrentCell, 1),
    board.maxCell,
  );
  const cellContent = board.cells[modalCellNumber - 1] ?? board.cells[0];
  const isAnimatingMove = turnState === 'animating';
  const lastMoveType = lastMove ? resolveMoveType(lastMove) : 'normal';
  const lastMovePresentation = getMovePresentation(lastMoveType);

  const onMoveAnimationComplete = useCallback((moveId: string) => {
    if (pendingMoveIdRef.current !== moveId) {
      return;
    }

    if (pendingSimpleMoveRef.current && pendingSimpleMoveRef.current.moveId === moveId) {
      const pending = pendingSimpleMoveRef.current;
      let nextIndex = activeSimplePlayerIndex;
      let nextPlayersSnapshot: SimplePlayerState[] = [];
      setSimplePlayers((prev) => {
        const nextPlayers = prev.map((player) =>
          player.id === pending.playerId
            ? {
                ...player,
                currentCell: pending.toCell,
                finished: pending.finished,
                hasEnteredGame: pending.hasEnteredGame,
              }
            : player,
        );
        nextPlayersSnapshot = nextPlayers;
        const unfinished = nextPlayers
          .map((player, index) => ({ player, index }))
          .filter((entry) => !entry.player.finished);
        if (unfinished.length === 0) {
          nextIndex = activeSimplePlayerIndex;
        } else {
          const currentPos = unfinished.findIndex((entry) => entry.index === activeSimplePlayerIndex);
          nextIndex =
            currentPos === -1 ? unfinished[0].index : unfinished[(currentPos + 1) % unfinished.length].index;
        }
        return nextPlayers;
      });
      setActiveSimplePlayerIndex(nextIndex);
      {
        const prev = simpleHistoryByPlayerRef.current;
        const nextHistory: Record<string, SimplePlayerHistoryEntry[]> = {
          ...prev,
          [pending.playerId]: [
            ...(prev[pending.playerId] ?? []),
            {
              fromCell: pending.fromCell,
              toCell: pending.toCell,
              dice: pending.dice,
              moveType: pending.moveType,
              snakeOrArrow: pending.snakeOrArrow,
              createdAt: pending.createdAt,
            },
          ],
        };
        simpleHistoryByPlayerRef.current = nextHistory;

        const payload: SimpleMultiplayerPayload = {
          players: nextPlayersSnapshot.map((player) => ({
            id: player.id,
            name: player.name,
            request: player.request,
            color: player.color,
            currentCell: player.currentCell,
            hasEnteredGame: player.hasEnteredGame,
            finished: player.finished,
          })),
          historyByPlayer: nextHistory,
        };
        void updateSessionRequest({ question: JSON.stringify(payload) });
      }
      pendingModalCellRef.current = pending.toCell;
      pendingSimpleMoveRef.current = undefined;
      setTurnState('idle');
      setAnimationMove(undefined);
      setShowCoach(true);
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
    setShowCoach(true);
    setAnimationMove(undefined);
  }, [activeSimplePlayerIndex, updateSessionRequest]);

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

  if (!currentSession) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
        <p className="text-sm text-stone-700">
          {loading
            ? 'Відновлюємо останню сесію...'
            : 'Немає активної сесії. Поверніться в налаштування.'}
        </p>
        {!loading && (
          <Link to="/setup" className="mt-3 inline-block text-sm text-emerald-700">До налаштувань</Link>
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
      setAnimationMove({
        id: moveId,
        fromCell: computed.fromCell,
        toCell: computed.toCell,
        type: computed.snakeOrArrow ?? null,
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

    pendingMoveIdRef.current = move.id;
    pendingModalCellRef.current = move.toCell;
    pendingEntryMoveIdRef.current = undefined;
    pendingEntryResultRef.current = undefined;

    if (isDeepEntryRoll) {
      pendingEntryMoveIdRef.current = move.id;
      pendingEntryResultRef.current = move.dice === 6 ? 'entered' : 'retry';
    }

    setAnimationMove({
      id: move.id,
      fromCell: move.fromCell,
      toCell: move.toCell,
      type: move.snakeOrArrow ?? null,
    });
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

  if ((!isSimpleMultiplayer && currentSession.finished) || multiplayerFinished) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-6">
        <FinalScreen onViewPath={() => navigate('/history')} onStartNew={() => navigate('/setup')} />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-4 py-5">
      <header className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-stone-800">
            {isSimpleMultiplayer
              ? `Хід: ${activeSimplePlayer?.name ?? 'Учасник'} · клітина ${safeCurrentCell}`
              : `Ви зараз на клітині ${safeCurrentCell}`}
          </p>
          <button
            type="button"
            onClick={() => setShowHintInfo((prev) => !prev)}
            aria-label="Підказка про змій і стріли"
            className="rounded-full border border-stone-300 px-2 py-1 text-xs text-stone-600 transition hover:bg-stone-100"
          >
            ?
          </button>
        </div>
        <h1 className="mt-1 text-base font-semibold text-stone-900">{currentChakra?.name ?? 'Шлях триває'}</h1>
        {isSimpleMultiplayer && (
          <div className="mt-2 flex flex-wrap gap-2">
            {simplePlayers.map((player, index) => (
              <span
                key={player.id}
                className={`rounded-full border px-2 py-1 text-xs ${
                  index === activeSimplePlayerIndex ? 'border-stone-400 bg-stone-100' : 'border-stone-200 bg-white'
                }`}
              >
                <span
                  className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ backgroundColor: SIMPLE_COLOR_HEX[player.color] ?? '#1f2937' }}
                />
                {player.name || `Учасник ${index + 1}`} · {player.currentCell}
              </span>
            ))}
          </div>
        )}
        {currentChakra && <p className="mt-1 text-xs text-stone-600">{currentChakra.description}</p>}
        {currentSession.request.isDeepEntry && !currentSession.hasEnteredGame && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Щоб увійти в глибоку гру, потрібно викинути 6.
          </p>
        )}
        {entryHint && <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{entryHint}</p>}
        {showHintInfo && (
          <p className="mt-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
            Змії — це уроки. Стріли — це ресурси.
          </p>
        )}
        <div className="mt-2">
          <ChakraNotification text={`Ви увійшли в ${currentChakra?.name ?? 'новий рівень'}.`} />
        </div>
      </header>

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
        onMoveAnimationComplete={onMoveAnimationComplete}
      />

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <Dice value={lastMove?.dice} />
          <div className="text-right text-xs text-stone-600">
            <p>{isSimpleMultiplayer ? 'Гравці ходять по черзі.' : 'Можна зробити паузу будь-коли.'}</p>
            {error && <p className="text-red-600">{error}</p>}
          </div>
        </div>
        {lastMove && lastMoveType !== 'normal' && (
          <p className={`mb-3 rounded-xl px-3 py-2 text-xs font-medium ${lastMovePresentation.badgeClassName}`}>
            {lastMovePresentation.icon} Спецхід: {lastMovePresentation.label} · {formatMovePath(lastMove)}
          </p>
        )}
        <motion.button
          onClick={() => {
            triggerDiceRoll();
          }}
          type="button"
          disabled={turnState !== 'idle'}
          className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white transition duration-300 ease-out disabled:opacity-70"
          whileTap={buttonTapScale}
          whileHover={buttonHoverScale}
        >
          Кинути кубик
        </motion.button>
        <button
          type="button"
          onClick={() => setShowFinishConfirm(true)}
          disabled={turnState !== 'idle'}
          className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700 transition disabled:opacity-50"
        >
          Завершити подорож
        </button>
        <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
          <Link className="transition duration-200 ease-out hover:scale-[1.02] active:scale-[0.99]" to="/settings">
            Налаштування
          </Link>
          <Link className="transition duration-200 ease-out hover:scale-[1.02] active:scale-[0.99]" to="/history">
            Мій шлях
          </Link>
          <span>Звук</span>
        </div>
      </section>

      <AnimatePresence>
        {showFinishConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl bg-white p-4 shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
            >
              <h3 className="text-lg font-semibold text-stone-900">Завершити подорож?</h3>
              <p className="mt-2 text-sm text-stone-600">
                Поточну сесію буде позначено завершеною. Нові ходи стануть недоступними.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void finishSession().then(() => setShowFinishConfirm(false));
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white"
                >
                  Так, завершити
                </button>
                <button
                  type="button"
                  onClick={() => setShowFinishConfirm(false)}
                  className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm text-stone-700"
                >
                  Повернутись
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showDeepRequestModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
            >
              <h3 className="text-lg font-semibold text-stone-900">Мій запит</h3>
              <p className="mt-2 text-sm text-stone-600">
                Ще не 6. Уточніть намір і киньте кубик знову.
              </p>
              <textarea
                value={deepRequestDraft}
                onChange={(event) => setDeepRequestDraft(event.target.value)}
                placeholder={
                  'Сформулюй його чітко за формулою:\nПотреба + Питання\n(“Хочу відчувати гармонію у стосунках” +\n“Що мені заважає це відчувати?”)'
                }
                className="mt-3 min-h-32 w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm text-stone-700 outline-none focus:border-emerald-300"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void updateSessionRequest(deepRequestDraft).then(() => {
                      setShowDeepRequestModal(false);
                    });
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white"
                >
                  Зберегти намір
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeepRequestModal(false)}
                  className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm text-stone-700"
                >
                  Закрити
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showCoach && (
          <CellCoachModal
            cellNumber={modalCellNumber}
            cellContent={cellContent}
            depth={currentSession.settings.depth}
            moveContext={
              lastMove && lastMove.toCell === modalCellNumber
                ? {
                    fromCell: lastMove.fromCell,
                    toCell: lastMove.toCell,
                    type:
                      lastMove.moveType ??
                      (lastMove.snakeOrArrow === 'snake'
                        ? 'snake'
                        : lastMove.snakeOrArrow === 'arrow'
                          ? 'ladder'
                          : 'normal'),
                  }
                : undefined
            }
            onSave={(text) => {
              void saveInsight(modalCellNumber, text).then(() => setShowCoach(false));
            }}
            onSkip={() => setShowCoach(false)}
            onClose={() => setShowCoach(false)}
          />
        )}
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
