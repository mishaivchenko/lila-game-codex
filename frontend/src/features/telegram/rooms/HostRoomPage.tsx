import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BOARD_DEFINITIONS } from '../../../content/boards';
import { AppearanceCustomizationPanel } from '../../../components/AppearanceCustomizationPanel';
import { CellCoachModal } from '../../../components/CellCoachModal';
import { LilaBoard, type LilaTransition } from '../../../components/lila/LilaBoard';
import { Dice3D } from '../../../components/dice3d/Dice3D';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { getTelegramWebApp } from '../telegramWebApp';
import { BOT_USERNAME, CHANNEL_URL, buildRoomInviteByIdUrl, buildRoomInviteUrl } from '../telegramLinks';
import { ROOM_TOKEN_COLOR_PALETTE } from './roomsApi';
import { useTelegramRooms } from './TelegramRoomsContext';
import { buildStepwiseCellPath, resolveTransitionEntryCell } from '../../../lib/lila/moveVisualization';
import { getBoardTransitionPath } from '../../../lib/lila/boardProfiles';
import type { BoardPathPoint } from '../../../lib/lila/boardProfiles/types';
import { formatMovePathWithEntry, resolveMoveType } from '../../../lib/lila/historyFormat';
import { playCardOpen, playDiceRoll, playLadderMove, playSnakeMove } from '../telegramHaptics';
import { DEFAULT_ANIMATION_TIMINGS } from '../../../lib/animations/animationTimingSettings';
import { DEFAULT_MOVEMENT_SETTINGS, normalizeMovementSettings } from '../../../engine/movement/MovementEngine';

const roomStatusLabel: Record<'open' | 'in_progress' | 'paused' | 'finished', string> = {
  open: 'Відкрита',
  in_progress: 'У процесі',
  paused: 'На паузі',
  finished: 'Завершена',
};

const diceModeLabel: Record<'classic' | 'fast' | 'triple', string> = {
  classic: 'Класичний',
  fast: 'Швидкий',
  triple: 'Питання дня',
};

export const HostRoomPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { user, isTelegramMode } = useTelegramAuth();
  const {
    currentRoom,
    isLoading,
    error,
    loadRoomById,
    hostStartGame,
    hostPauseGame,
    hostResumeGame,
    hostFinishGame,
    hostUpdateSettings,
    rollDice,
    closeActiveCard,
    saveRoomNote,
    updatePlayerTokenColor,
    clearCurrentRoom,
    isMyTurn,
    connectionState,
    lastDiceRoll,
  } = useTelegramRooms();
  const [inviteCopied, setInviteCopied] = useState(false);
  const [finishRequested, setFinishRequested] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [previewCellNumber, setPreviewCellNumber] = useState<number | undefined>(undefined);
  const [selectedHostNotesPlayerId, setSelectedHostNotesPlayerId] = useState<string | undefined>(undefined);
  const [hostPrivateNote, setHostPrivateNote] = useState('');
  const [hostNoteStatus, setHostNoteStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isRolling, setIsRolling] = useState(false);
  const [diceRollToken, setDiceRollToken] = useState(0);
  const [pendingDiceValues, setPendingDiceValues] = useState<number[] | undefined>(undefined);
  const [animationMove, setAnimationMove] = useState<LilaTransition | undefined>(undefined);
  const [animatedPlayerId, setAnimatedPlayerId] = useState<string | undefined>(undefined);
  const [isFlowCardReady, setIsFlowCardReady] = useState(true);
  const [specialFlow, setSpecialFlow] = useState<
    | {
      moveId: string;
      playerUserId: string;
      type: 'snake' | 'arrow';
      headCell: number;
      tailCell: number;
      pathPoints?: BoardPathPoint[];
      phase: 'entry-animation' | 'entry-card' | 'special-animation' | 'target-card';
    }
    | undefined
  >(undefined);
  const processedMoveKeyRef = useRef<string | undefined>(undefined);
  const processedMoveCountRef = useRef(0);
  const flowCardTimerRef = useRef<number | undefined>(undefined);
  const cardVisibleRef = useRef(false);
  const lastTransitionEntryCellRef = useRef<number | undefined>(undefined);
  const isCurrentUserHost = currentRoom?.room.hostUserId === user?.id;
  const movementSettings = useMemo(
    () => normalizeMovementSettings(DEFAULT_MOVEMENT_SETTINGS),
    [],
  );

  useEffect(() => {
    if (!isTelegramMode) {
      return;
    }
    if (!roomId) {
      return;
    }
    if (currentRoom?.room.id === roomId) {
      return;
    }
    void loadRoomById(roomId);
  }, [currentRoom?.room.id, isTelegramMode, loadRoomById, roomId]);

  useEffect(() => {
    if (!inviteCopied) {
      return undefined;
    }
    const timer = window.setTimeout(() => setInviteCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [inviteCopied]);

  useEffect(() => {
    if (!currentRoom || !isCurrentUserHost) {
      setSelectedHostNotesPlayerId(undefined);
      setHostPrivateNote('');
      return;
    }
    const hostNotesPlayers = currentRoom.players.filter((player) => player.role === 'player');
    if (!hostNotesPlayers.length) {
      setSelectedHostNotesPlayerId(undefined);
      setHostPrivateNote('');
      return;
    }
    const fallbackPlayerId = selectedHostNotesPlayerId && hostNotesPlayers.some((player) => player.userId === selectedHostNotesPlayerId)
      ? selectedHostNotesPlayerId
      : hostNotesPlayers[0].userId;
    setSelectedHostNotesPlayerId(fallbackPlayerId);
    setHostPrivateNote(currentRoom.gameState.notes.hostByPlayerId?.[fallbackPlayerId] ?? '');
  }, [currentRoom, isCurrentUserHost, selectedHostNotesPlayerId]);

  useEffect(() => {
    if (!currentRoom) {
      processedMoveKeyRef.current = undefined;
      processedMoveCountRef.current = 0;
      setAnimationMove(undefined);
      setAnimatedPlayerId(undefined);
      setSpecialFlow(undefined);
      setPendingDiceValues(undefined);
      setIsFlowCardReady(true);
      lastTransitionEntryCellRef.current = undefined;
      return;
    }
    const lastMove = currentRoom.gameState.moveHistory.at(-1);
    if (!lastMove) {
      processedMoveCountRef.current = 0;
      return;
    }
    const moveCount = currentRoom.gameState.moveHistory.length;
    if (moveCount <= processedMoveCountRef.current) {
      return;
    }
    const moveKey = `${lastMove.userId}:${lastMove.timestamp}:${lastMove.fromCell}:${lastMove.toCell}`;
    if (processedMoveKeyRef.current === moveKey) {
      processedMoveCountRef.current = moveCount;
      return;
    }
    processedMoveKeyRef.current = moveKey;
    processedMoveCountRef.current = moveCount;
    setIsFlowCardReady(false);
    lastTransitionEntryCellRef.current = undefined;
    setPendingDiceValues(lastMove.diceValues?.length ? lastMove.diceValues : [lastMove.dice]);
    setDiceRollToken((value) => value + 1);
    playDiceRoll();

    const board = BOARD_DEFINITIONS[currentRoom.room.boardType];
    const moveType = lastMove.snakeOrArrow;
    const entryCell = resolveTransitionEntryCell(
      lastMove.fromCell,
      lastMove.dice,
      board,
      moveType,
      lastMove.toCell,
    );
    const pathPoints = moveType && entryCell
      ? getBoardTransitionPath(currentRoom.room.boardType, moveType, entryCell, lastMove.toCell)?.points
      : undefined;
    lastTransitionEntryCellRef.current = entryCell;
    if (moveType === 'snake') {
      playSnakeMove();
    }
    if (moveType === 'arrow') {
      playLadderMove();
    }
    const tokenPathCells = buildStepwiseCellPath(lastMove.fromCell, lastMove.dice, board.maxCell);

    const isSpecialFlow =
      (moveType === 'snake' || moveType === 'arrow')
      && Boolean(entryCell)
      && Boolean(pathPoints?.length)
      && entryCell !== lastMove.toCell;

    setAnimatedPlayerId(lastMove.userId);
    if (isSpecialFlow) {
      const entryTokenPath = tokenPathCells.filter((cell) => cell <= (entryCell ?? lastMove.toCell));
      setSpecialFlow({
        moveId: moveKey,
        playerUserId: lastMove.userId,
        type: moveType!,
        headCell: entryCell!,
        tailCell: lastMove.toCell,
        pathPoints,
        phase: 'entry-animation',
      });
      setAnimationMove({
        id: moveKey,
        fromCell: lastMove.fromCell,
        toCell: entryCell!,
        type: null,
        tokenPathCells: entryTokenPath.length >= 2 ? entryTokenPath : [lastMove.fromCell, entryCell!],
      });
      return;
    }
    setSpecialFlow(undefined);
    setAnimationMove({
      id: moveKey,
      fromCell: lastMove.fromCell,
      toCell: lastMove.toCell,
      type: moveType,
      entryCell,
      pathPoints,
      tokenPathCells,
    });
  }, [currentRoom]);

  useEffect(() => {
    if (flowCardTimerRef.current !== undefined) {
      window.clearTimeout(flowCardTimerRef.current);
      flowCardTimerRef.current = undefined;
    }
    if (animationMove) {
      return;
    }
    flowCardTimerRef.current = window.setTimeout(() => {
      setIsFlowCardReady(true);
    }, 260);
    return () => {
      if (flowCardTimerRef.current !== undefined) {
        window.clearTimeout(flowCardTimerRef.current);
      }
    };
  }, [animationMove]);

  if (!roomId) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
        <p className="text-sm text-[var(--lila-text-muted)]">Room id is missing.</p>
        <Link to="/" className="text-sm underline">Back home</Link>
      </main>
    );
  }

  if (!isTelegramMode) {
    const telegramLink = buildRoomInviteByIdUrl(roomId);
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
        <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-6 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--lila-text-muted)]">Host Room</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--lila-text-primary)]">Відкрити кімнату в Telegram</h1>
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">
            Посилання на кімнату працює тільки в Telegram Mini App. Відкрийте бота в Telegram та перейдіть у кімнату звідти.
          </p>
          <a
            href={telegramLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-2xl bg-[var(--lila-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Відкрити в Telegram
          </a>
        </section>
      </main>
    );
  }

  if (!currentRoom) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
        <p className="text-sm text-[var(--lila-text-muted)]">{isLoading ? 'Завантаження кімнати...' : 'Кімнату не знайдено.'}</p>
        <Link to="/" className="text-sm underline">Back home</Link>
      </main>
    );
  }

  const board = BOARD_DEFINITIONS[currentRoom.room.boardType];
  const selfPlayer = currentRoom.players.find((player) => player.userId === user?.id);
  const playerEntries = currentRoom.players.filter((player) => player.role === 'player');
  const currentTurnPlayer = currentRoom.players.find((entry) => entry.userId === currentRoom.gameState.currentTurnPlayerId);
  const activeCard = currentRoom.gameState.activeCard;
  const localSpecialCard = specialFlow && (specialFlow.phase === 'entry-card' || specialFlow.phase === 'target-card')
    ? {
      cellNumber: specialFlow.phase === 'entry-card' ? specialFlow.headCell : specialFlow.tailCell,
      playerUserId: specialFlow.playerUserId,
    }
    : undefined;
  const isPreviewCardOpen = previewCellNumber !== undefined;
  const displayedCellNumber = previewCellNumber ?? localSpecialCard?.cellNumber ?? activeCard?.cellNumber;
  const displayedPlayerUserId = isPreviewCardOpen
    ? (isCurrentUserHost ? currentTurnPlayer?.userId : user?.id)
    : localSpecialCard?.playerUserId ?? activeCard?.playerUserId;
  const canSeeActiveCard = Boolean(
    displayedCellNumber
      && user
      && (isCurrentUserHost || displayedPlayerUserId === user.id),
  );
  const activePlayer = displayedPlayerUserId
    ? currentRoom.players.find((player) => player.userId === displayedPlayerUserId)
    : undefined;
  const currentCellContent = displayedCellNumber ? board.cells[displayedCellNumber - 1] : undefined;
  const activeCellNumber = displayedCellNumber;
  const noteScope = isCurrentUserHost ? 'host' : 'player';
  const initialModalText = (() => {
    if (!activeCellNumber || !user) {
      return '';
    }
    if (isCurrentUserHost) {
      return currentRoom.gameState.notes.hostByCell[String(activeCellNumber)] ?? '';
    }
    return currentRoom.gameState.notes.playerByUserId[user.id]?.[String(activeCellNumber)] ?? '';
  })();
  const botInviteUrl = buildRoomInviteUrl(currentRoom.room.code);
  const joinLink = botInviteUrl;
  const hostNotesPlayers = currentRoom.players.filter((player) => player.role === 'player');
  const primaryTokenPlayer = useMemo(() => {
    if (animatedPlayerId) {
      return playerEntries.find((player) => player.userId === animatedPlayerId);
    }
    return isCurrentUserHost
    ? (currentTurnPlayer?.role === 'player' ? currentTurnPlayer : playerEntries[0])
    : selfPlayer;
  }, [animatedPlayerId, currentTurnPlayer, isCurrentUserHost, playerEntries, selfPlayer]);
  const primaryTokenCell = primaryTokenPlayer
    ? (currentRoom.gameState.perPlayerState[primaryTokenPlayer.userId]?.currentCell ?? 1)
    : 1;
  const boardOtherTokens = playerEntries
    .filter((player) => player.userId !== primaryTokenPlayer?.userId)
    .map((player) => ({
      id: player.userId,
      cell: currentRoom.gameState.perPlayerState[player.userId]?.currentCell ?? 1,
      color: player.tokenColor,
    }));

  const hostMoveSummary = !lastDiceRoll
    ? 'Ще немає кидків у цій сесії.'
    : `${currentRoom.players.find((player) => player.userId === lastDiceRoll.playerId)?.displayName ?? 'Гравець'} кинув ${lastDiceRoll.diceValues.join(' + ')} = ${lastDiceRoll.dice}`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setInviteCopied(true);
    } catch {
      setInviteCopied(false);
    }
  };

  const openInviteInTelegram = () => {
    if (!currentRoom) {
      return;
    }
    const deepLink = buildRoomInviteUrl(currentRoom.room.code);
    const webApp = getTelegramWebApp();
    webApp?.openTelegramLink?.(deepLink);
  };

  const handleCardSave = async (text: string) => {
    if (!activeCellNumber) {
      return;
    }
    await saveRoomNote({
      cellNumber: activeCellNumber,
      note: text,
      scope: noteScope,
    });
    if (isPreviewCardOpen) {
      setPreviewCellNumber(undefined);
      return;
    }
    if (specialFlow?.phase === 'entry-card') {
      setSpecialFlow((prev) => (prev ? { ...prev, phase: 'special-animation' } : prev));
      setAnimationMove({
        id: `${specialFlow.moveId}-special`,
        fromCell: specialFlow.headCell,
        toCell: specialFlow.tailCell,
        type: specialFlow.type,
        entryCell: specialFlow.headCell,
        pathPoints: specialFlow.pathPoints,
        tokenPathCells: [specialFlow.headCell],
      });
      if (specialFlow.type === 'snake') {
        playSnakeMove();
      } else {
        playLadderMove();
      }
      return;
    }
    await closeActiveCard();
  };

  const handleCardSkip = async () => {
    if (isPreviewCardOpen) {
      setPreviewCellNumber(undefined);
      return;
    }
    if (specialFlow?.phase === 'entry-card') {
      setSpecialFlow((prev) => (prev ? { ...prev, phase: 'special-animation' } : prev));
      setAnimationMove({
        id: `${specialFlow.moveId}-special`,
        fromCell: specialFlow.headCell,
        toCell: specialFlow.tailCell,
        type: specialFlow.type,
        entryCell: specialFlow.headCell,
        pathPoints: specialFlow.pathPoints,
        tokenPathCells: [specialFlow.headCell],
      });
      if (specialFlow.type === 'snake') {
        playSnakeMove();
      } else {
        playLadderMove();
      }
      return;
    }
    await closeActiveCard();
  };

  const hostCanPause = currentRoom.gameState.settings.hostCanPause;
  const canShowCardModal = Boolean(
    canSeeActiveCard
    && currentCellContent
    && activeCellNumber !== undefined
    && !animationMove
    && (isPreviewCardOpen || isFlowCardReady),
  );

  useEffect(() => {
    if (canShowCardModal && !cardVisibleRef.current) {
      playCardOpen();
    }
    cardVisibleRef.current = canShowCardModal;
  }, [canShowCardModal]);

  const latestMove = currentRoom.gameState.moveHistory.at(-1);
  const latestMoveType = latestMove ? resolveMoveType(latestMove) : 'normal';
  const latestPathLabel = latestMove
    ? formatMovePathWithEntry(
      latestMove,
      board.maxCell,
    )
    : undefined;
  const modalCellNumberSafe = activeCellNumber ?? primaryTokenCell;
  const modalCellContentSafe = currentCellContent ?? board.cells[Math.max(modalCellNumberSafe - 1, 0)] ?? board.cells[0];

  return (
    <>
      <main className="mx-auto min-h-screen max-w-[1460px] bg-[var(--lila-bg-main)] px-3 py-4 sm:px-4 lg:px-5 xl:h-[calc(100dvh-20px)] xl:overflow-hidden">
      {error && (
        <p className="mb-3 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 xl:h-full xl:grid-cols-[320px,minmax(0,1fr),320px]">
        <aside className="space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
          <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Host Room</p>
                <h1 className="mt-1 text-2xl font-semibold text-[var(--lila-text-primary)]">
                  Код {currentRoom.room.code}
                </h1>
              </div>
              <Link
                to="/"
                onClick={clearCurrentRoom}
                className="rounded-xl border border-[var(--lila-border-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]"
              >
                Вийти
              </Link>
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-[var(--lila-surface-muted)] px-3 py-2">
                <dt className="text-[var(--lila-text-muted)]">Статус</dt>
                <dd className="font-semibold text-[var(--lila-text-primary)]">{roomStatusLabel[currentRoom.room.status]}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--lila-surface-muted)] px-3 py-2">
                <dt className="text-[var(--lila-text-muted)]">Зʼєднання</dt>
                <dd className="font-semibold text-[var(--lila-text-primary)]">{connectionState}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--lila-surface-muted)] px-3 py-2">
                <dt className="text-[var(--lila-text-muted)]">Поточний хід</dt>
                <dd className="font-semibold text-[var(--lila-text-primary)]">{currentTurnPlayer?.displayName ?? '—'}</dd>
              </div>
              <div className="rounded-2xl bg-[var(--lila-surface-muted)] px-3 py-3">
                <dt className="text-[var(--lila-text-muted)]">Запрошення</dt>
                <dd className="mt-1 break-all text-xs text-[var(--lila-text-primary)]">{joinLink}</dd>
                <button
                  type="button"
                  onClick={() => {
                    void copyInviteLink();
                  }}
                  className="mt-3 w-full rounded-xl bg-[var(--lila-accent)] px-3 py-2 text-sm font-medium text-white"
                >
                  {inviteCopied ? 'Посилання скопійовано' : 'Скопіювати посилання'}
                </button>
                <button
                  type="button"
                  onClick={openInviteInTelegram}
                  className="mt-2 w-full rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-3 py-2 text-sm text-[var(--lila-text-primary)]"
                >
                  Відкрити invite в Telegram
                </button>
                <a
                  href={botInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block w-full rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-3 py-2 text-center text-sm text-[var(--lila-text-primary)]"
                >
                  Bot: @{BOT_USERNAME}
                </a>
                <a
                  href={CHANNEL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block w-full rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-3 py-2 text-center text-sm text-[var(--lila-text-primary)]"
                >
                  Канал про гру
                </a>
              </div>
            </dl>
          </section>

          {isCurrentUserHost && (
            <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Адмінка ведучого</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--lila-text-primary)]">Керуйте сесією</h2>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => void hostStartGame()}
                  disabled={currentRoom.room.status === 'in_progress'}
                  className="rounded-2xl bg-[var(--lila-accent)] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  Почати гру
                </button>
                <button
                  type="button"
                  onClick={() => void hostPauseGame()}
                  disabled={!hostCanPause || currentRoom.room.status !== 'in_progress'}
                  className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-4 py-3 text-sm text-[var(--lila-text-primary)] disabled:opacity-50"
                >
                  Пауза
                </button>
                <button
                  type="button"
                  onClick={() => void hostResumeGame()}
                  disabled={currentRoom.room.status !== 'paused'}
                  className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-4 py-3 text-sm text-[var(--lila-text-primary)] disabled:opacity-50"
                >
                  Продовжити
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (finishRequested) {
                      return;
                    }
                    setFinishRequested(true);
                    void hostFinishGame().finally(() => {
                      setFinishRequested(false);
                    });
                  }}
                  disabled={finishRequested || currentRoom.room.status === 'finished'}
                  className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {finishRequested ? 'Завершуємо...' : 'Завершити кімнату'}
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lila-text-muted)]">Режим кубиків кімнати</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(['classic', 'fast', 'triple'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => void hostUpdateSettings({ diceMode: mode })}
                        className={`min-h-[56px] rounded-2xl border px-2 py-2 text-center text-xs leading-tight sm:text-sm ${
                          currentRoom.gameState.settings.diceMode === mode
                            ? 'border-[var(--lila-accent)] bg-[var(--lila-chip-active-bg)] text-[var(--lila-chip-active-text)]'
                            : 'border-[var(--lila-chip-border)] bg-[var(--lila-chip-bg)] text-[var(--lila-chip-text)]'
                        }`}
                      >
                      {diceModeLabel[mode]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAppearanceModal(true)}
                className="mt-5 w-full rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-4 py-3 text-sm text-[var(--lila-text-primary)]"
              >
                Локальний вигляд (Appearance Studio)
              </button>

                <label className="flex items-center justify-between rounded-2xl border border-[var(--lila-border-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">
                  <span>Ведучий може закривати будь-яку картку</span>
                  <input
                    type="checkbox"
                    checked={currentRoom.gameState.settings.allowHostCloseAnyCard}
                    onChange={(event) => {
                      void hostUpdateSettings({ allowHostCloseAnyCard: event.target.checked });
                    }}
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-[var(--lila-border-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">
                  <span>Дозволити паузу для цієї кімнати</span>
                  <input
                    type="checkbox"
                    checked={currentRoom.gameState.settings.hostCanPause}
                    onChange={(event) => {
                      void hostUpdateSettings({ hostCanPause: event.target.checked });
                    }}
                  />
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lila-text-muted)]">Приватні нотатки ведучого</p>
                <p className="mt-1 text-xs text-[var(--lila-text-muted)]">Видимі лише вам, не показуються гравцям.</p>
                {hostNotesPlayers.length > 0 ? (
                  <>
                    <select
                      value={selectedHostNotesPlayerId}
                      onChange={(event) => {
                        const playerId = event.target.value;
                        setSelectedHostNotesPlayerId(playerId);
                        setHostPrivateNote(currentRoom.gameState.notes.hostByPlayerId?.[playerId] ?? '');
                      }}
                      className="mt-2 w-full rounded-xl border border-[var(--lila-input-border)] bg-[var(--lila-input-bg)] px-3 py-2 text-sm text-[var(--lila-text-primary)]"
                    >
                      {hostNotesPlayers.map((player) => (
                        <option key={player.userId} value={player.userId}>
                          {player.displayName}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={hostPrivateNote}
                      onChange={(event) => setHostPrivateNote(event.target.value)}
                      placeholder="Спостереження, реакції, фокус для ведення..."
                      className="mt-2 min-h-24 w-full rounded-xl border border-[var(--lila-input-border)] bg-[var(--lila-input-bg)] px-3 py-2 text-sm text-[var(--lila-text-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedHostNotesPlayerId) {
                          return;
                        }
                        setHostNoteStatus('saving');
                        void saveRoomNote({
                          cellNumber: 1,
                          note: hostPrivateNote,
                          scope: 'host_player',
                          targetPlayerId: selectedHostNotesPlayerId,
                        })
                          .then(() => {
                            setHostNoteStatus('saved');
                            window.setTimeout(() => setHostNoteStatus('idle'), 1400);
                          })
                          .catch(() => {
                            setHostNoteStatus('error');
                          });
                      }}
                      className="mt-2 w-full rounded-xl bg-[var(--lila-accent)] px-3 py-2 text-sm font-medium text-white"
                    >
                      {hostNoteStatus === 'saving' ? 'Збереження...' : 'Зберегти нотатку ведучого'}
                    </button>
                    {hostNoteStatus === 'saved' && (
                      <p className="mt-2 text-xs text-emerald-700">Нотатку збережено.</p>
                    )}
                    {hostNoteStatus === 'error' && (
                      <p className="mt-2 text-xs text-rose-700">Не вдалося зберегти нотатку.</p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-xs text-[var(--lila-text-muted)]">Зʼявиться, коли в кімнаті буде хоча б один гравець.</p>
                )}
              </div>
            </section>
          )}

          {!isCurrentUserHost && (
            <AppearanceCustomizationPanel
              defaultExpanded={false}
              title="Мої локальні налаштування"
            />
          )}
        </aside>

        <section className="space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
          <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-3 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Shared Board</p>
                <h2 className="text-lg font-semibold text-[var(--lila-text-primary)]">
                  {isCurrentUserHost ? 'Поле ведучого' : 'Спільна дошка'}
                </h2>
              </div>
              <div className="rounded-full bg-[var(--lila-surface-muted)] px-3 py-1.5 text-xs text-[var(--lila-text-primary)]">
                {hostMoveSummary}
              </div>
            </div>

            <LilaBoard
              board={board}
              currentCell={primaryTokenCell}
              otherTokens={boardOtherTokens}
              tokenColor={primaryTokenPlayer?.tokenColor}
              animationMove={animationMove}
              animationTimings={DEFAULT_ANIMATION_TIMINGS}
              movementSettings={movementSettings}
              onMoveAnimationComplete={() => {
                if (specialFlow?.phase === 'entry-animation') {
                  setAnimationMove(undefined);
                  setSpecialFlow((prev) => (prev ? { ...prev, phase: 'entry-card' } : prev));
                  return;
                }
                if (specialFlow?.phase === 'special-animation') {
                  setAnimationMove(undefined);
                  setSpecialFlow((prev) => (prev ? { ...prev, phase: 'target-card' } : prev));
                  return;
                }
                setAnimationMove(undefined);
                setAnimatedPlayerId(undefined);
              }}
              onCellSelect={(cellNumber) => {
                setPreviewCellNumber(cellNumber);
              }}
            />
          </section>

          <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Player Action</p>
                <h3 className="text-lg font-semibold text-[var(--lila-text-primary)]">
                  {isMyTurn ? 'Ваш хід' : `Хід: ${currentTurnPlayer?.displayName ?? '—'}`}
                </h3>
              </div>
              {!isCurrentUserHost ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isRolling) {
                      return;
                    }
                    setIsRolling(true);
                    void rollDice().finally(() => setIsRolling(false));
                  }}
                  disabled={
                    currentRoom.room.status !== 'in_progress'
                    || !isMyTurn
                    || Boolean(animationMove)
                    || Boolean(currentRoom.gameState.activeCard)
                    || isRolling
                  }
                  className="rounded-2xl bg-[var(--lila-accent)] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRolling ? 'Кидаємо…' : 'Кинути кубики'}
                </button>
              ) : (
                <span className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-4 py-2 text-xs font-medium text-[var(--lila-text-muted)]">
                  Ведучий не кидає кубики
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-[var(--lila-text-muted)]">
              Гравці самі кидають кубики. Ведучий утримує простір і може ставити кімнату на паузу без втрати стану.
            </p>
            <div className="relative z-10">
              <Dice3D
                rollToken={diceRollToken}
                diceValues={pendingDiceValues}
                onResult={() => {}}
                onFinished={() => setPendingDiceValues(undefined)}
              />
            </div>
          </section>

          {currentRoom.room.status === 'finished' && (
            <section className="rounded-3xl border border-emerald-300/60 bg-emerald-50/70 p-4">
              <h3 className="text-lg font-semibold text-emerald-900">Кімнату завершено</h3>
              <p className="mt-1 text-sm text-emerald-900/80">
                Сесію закрито. Нові гравці більше не можуть приєднатися.
              </p>
              <button
                type="button"
                onClick={() => {
                  clearCurrentRoom();
                  navigate('/');
                }}
                className="mt-3 rounded-xl border border-emerald-400/60 bg-white px-4 py-2 text-sm text-emerald-900"
              >
                Повернутися на головну
              </button>
            </section>
          )}
        </section>

        <aside className="space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
          <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Players</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--lila-text-primary)]">Учасники сесії</h2>
            <ul className="mt-4 space-y-2">
              {currentRoom.players.map((player) => {
                const playerState = currentRoom.gameState.perPlayerState[player.userId];
                const isCurrent = player.userId === currentRoom.gameState.currentTurnPlayerId;
                return (
                  <li key={player.userId} className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--lila-text-primary)]">
                          {player.displayName}
                          {isCurrent ? ' · Хід зараз' : ''}
                        </p>
                        <p className="text-xs text-[var(--lila-text-muted)]">
                          {player.role === 'host'
                            ? `Ведучий · Без фішки · ${player.connectionStatus}`
                            : `Гравець · Клітина ${playerState?.currentCell ?? 1} · ${player.connectionStatus}`}
                        </p>
                      </div>
                      <span
                        className="h-4 w-4 rounded-full border border-white/70"
                        style={{ backgroundColor: player.tokenColor }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Моя фішка</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--lila-text-primary)]">Колір токена</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {ROOM_TOKEN_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => void updatePlayerTokenColor(color)}
                  className={`h-10 w-10 rounded-full border-2 transition ${selfPlayer?.tokenColor === color ? 'scale-110 border-[var(--lila-accent)]' : 'border-white/60'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Token color ${color}`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--lila-text-muted)]">
              Цей параметр синхронізується для всієї кімнати. Решта візуальних тем у панелі ліворуч діють локально на ваш клієнт.
            </p>
          </section>

          <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Історія ходів</p>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
              {currentRoom.gameState.moveHistory.slice(-12).reverse().map((move) => {
                const player = currentRoom.players.find((entry) => entry.userId === move.userId);
                const marker = move.snakeOrArrow === 'snake' ? '⇩' : move.snakeOrArrow === 'arrow' ? '⇧' : '→';
                return (
                  <li key={`${move.userId}-${move.timestamp}`} className="rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-2">
                    <p className="text-xs font-semibold text-[var(--lila-text-primary)]">{player?.displayName ?? 'Гравець'}</p>
                    <p className="text-xs text-[var(--lila-text-muted)]">
                      {move.fromCell} {marker} {move.toCell} · {move.diceValues?.join(' + ') ?? move.dice}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      <AnimatePresence>
        {canShowCardModal && (
          <CellCoachModal
            cellNumber={modalCellNumberSafe}
            cellContent={modalCellContentSafe}
            depth="standard"
            initialText={initialModalText}
            onSave={(text) => {
              void handleCardSave(text);
            }}
            onSkip={() => {
              void handleCardSkip();
            }}
            onClose={() => {
              if (!isPreviewCardOpen && activeCard) {
                if (specialFlow?.phase === 'entry-card') {
                  setSpecialFlow((prev) => (prev ? { ...prev, phase: 'special-animation' } : prev));
                  setAnimationMove({
                    id: `${specialFlow.moveId}-special`,
                    fromCell: specialFlow.headCell,
                    toCell: specialFlow.tailCell,
                    type: specialFlow.type,
                    entryCell: specialFlow.headCell,
                    pathPoints: specialFlow.pathPoints,
                    tokenPathCells: [specialFlow.headCell],
                  });
                  if (specialFlow.type === 'snake') {
                    playSnakeMove();
                  } else {
                    playLadderMove();
                  }
                  return;
                }
                if (specialFlow?.phase === 'target-card') {
                  setSpecialFlow(undefined);
                }
                void closeActiveCard();
                return;
              }
              setPreviewCellNumber(undefined);
            }}
            moveContext={{
              fromCell: currentRoom.gameState.moveHistory.at(-1)?.fromCell ?? modalCellNumberSafe,
              toCell: modalCellNumberSafe,
              type: latestMoveType,
              pathLabel: latestPathLabel,
            }}
          />
        )}
      </AnimatePresence>

      {isCurrentUserHost && activeCard && activePlayer && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-40 hidden rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 px-4 py-3 shadow-lg lg:block">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Відкрита картка</p>
          <p className="text-sm font-semibold text-[var(--lila-text-primary)]">
            Клітина {activeCard.cellNumber} · {activePlayer.displayName}
          </p>
        </div>
      )}
      </main>

      <AnimatePresence>
        {showAppearanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3">
            <div className="max-h-[88dvh] w-full max-w-[560px] overflow-y-auto rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-4 shadow-[0_28px_64px_rgba(20,18,24,0.35)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--lila-text-primary)]">Appearance Studio</h3>
                <button
                  type="button"
                  onClick={() => setShowAppearanceModal(false)}
                  className="rounded-xl border border-[var(--lila-border-soft)] px-3 py-1.5 text-xs text-[var(--lila-text-primary)]"
                >
                  Закрити
                </button>
              </div>
              <AppearanceCustomizationPanel defaultExpanded title="Ваш локальний вигляд та атмосферa" />
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
