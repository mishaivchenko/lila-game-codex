import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BOARD_DEFINITIONS } from '../../../content/boards';
import { AppearanceCustomizationPanel } from '../../../components/AppearanceCustomizationPanel';
import { CellCoachModal } from '../../../components/CellCoachModal';
import { CompactPanelModal } from '../../../components/CompactPanelModal';
import { LilaBoard, type LilaTransition } from '../../../components/lila/LilaBoard';
import { Dice3D } from '../../../components/dice3d/Dice3D';
import { GameBoardLayout } from '../../../ui/layout/GameBoardLayout';
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

const ONLINE_CARD_TIMINGS_MS = {
  afterStepMove: 460,
  beforeSpecialEntryCard: 560,
  beforeSpecialTargetCard: 520,
  serverSyncCard: 240,
} as const;

interface PendingMovePlan {
  moveKey: string;
  playerUserId: string;
  fromCell: number;
  toCell: number;
  entryCell?: number;
  type: 'snake' | 'arrow' | null;
  pathPoints?: BoardPathPoint[];
  tokenPathCells?: number[];
  special?: {
    headCell: number;
    tailCell: number;
    type: 'snake' | 'arrow';
    pathPoints?: BoardPathPoint[];
  };
}

type UtilityPanelId = 'room' | 'players' | 'history' | 'notes';

export const HostRoomPage = () => {
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
    addHostControlledPlayer,
    hostSetPlayerCell,
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
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [activeUtilityPanel, setActiveUtilityPanel] = useState<UtilityPanelId>('room');
  const [previewCellNumber, setPreviewCellNumber] = useState<number | undefined>(undefined);
  const [selectedHostNotesPlayerId, setSelectedHostNotesPlayerId] = useState<string | undefined>(undefined);
  const [hostPrivateNotesDraftByPlayer, setHostPrivateNotesDraftByPlayer] = useState<Record<string, string>>({});
  const [hostNoteStatus, setHostNoteStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hostControlledDraftName, setHostControlledDraftName] = useState('');
  const [hostRollTargetId, setHostRollTargetId] = useState<string | undefined>(undefined);
  const [hostMoveCellDraftByPlayer, setHostMoveCellDraftByPlayer] = useState<Record<string, number>>({});
  const [isRolling, setIsRolling] = useState(false);
  const [diceRollToken, setDiceRollToken] = useState(0);
  const [pendingDiceValues, setPendingDiceValues] = useState<number[] | undefined>(undefined);
  const [pendingMovePlan, setPendingMovePlan] = useState<PendingMovePlan | undefined>(undefined);
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
  const cardRevealTimerRef = useRef<number | undefined>(undefined);
  const revealedServerCardKeyRef = useRef<string | undefined>(undefined);
  const cardVisibleRef = useRef(false);
  const lastTransitionEntryCellRef = useRef<number | undefined>(undefined);
  const isCurrentUserHost = currentRoom?.room.hostUserId === user?.id;
  const allRoomPlayers = currentRoom?.players ?? [];
  const playerEntriesForTurn = allRoomPlayers.filter((player) => player.role === 'player');
  const currentTurnPlayerForTurn = allRoomPlayers.find((entry) => entry.userId === currentRoom?.gameState.currentTurnPlayerId);
  const movementSettings = useMemo(
    () => normalizeMovementSettings(DEFAULT_MOVEMENT_SETTINGS),
    [],
  );
  const openUtilityPanel = useCallback((panel: UtilityPanelId) => {
    setActiveUtilityPanel(panel);
    setShowUtilityModal(true);
  }, []);
  const clearCardRevealTimer = useCallback(() => {
    if (cardRevealTimerRef.current !== undefined) {
      window.clearTimeout(cardRevealTimerRef.current);
      cardRevealTimerRef.current = undefined;
    }
  }, []);
  const scheduleCardReveal = useCallback((delayMs: number) => {
    clearCardRevealTimer();
    setIsFlowCardReady(false);
    cardRevealTimerRef.current = window.setTimeout(() => {
      setIsFlowCardReady(true);
    }, delayMs);
  }, [clearCardRevealTimer]);

  useEffect(() => {
    if (!isCurrentUserHost) {
      return;
    }
    const nextTarget = currentTurnPlayerForTurn?.role === 'player'
      ? currentTurnPlayerForTurn.userId
      : playerEntriesForTurn[0]?.userId;
    if (!nextTarget) {
      setHostRollTargetId(undefined);
      return;
    }
    if (!hostRollTargetId || !playerEntriesForTurn.some((player) => player.userId === hostRollTargetId)) {
      setHostRollTargetId(nextTarget);
    }
  }, [currentTurnPlayerForTurn, hostRollTargetId, isCurrentUserHost, playerEntriesForTurn]);

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
      setSelectedHostNotesPlayerId((previous) => (previous === undefined ? previous : undefined));
      setHostPrivateNotesDraftByPlayer((previous) => (Object.keys(previous).length === 0 ? previous : {}));
      return;
    }
    const hostNotesPlayers = currentRoom.players.filter((player) => player.role === 'player');
    if (!hostNotesPlayers.length) {
      setSelectedHostNotesPlayerId((previous) => (previous === undefined ? previous : undefined));
      setHostPrivateNotesDraftByPlayer((previous) => (Object.keys(previous).length === 0 ? previous : {}));
      return;
    }
    const fallbackPlayerId = selectedHostNotesPlayerId && hostNotesPlayers.some((player) => player.userId === selectedHostNotesPlayerId)
      ? selectedHostNotesPlayerId
      : hostNotesPlayers[0].userId;
    setSelectedHostNotesPlayerId(fallbackPlayerId);
    setHostPrivateNotesDraftByPlayer((previous) => {
      let changed = false;
      const next = { ...previous };
      for (const player of hostNotesPlayers) {
        if (next[player.userId] === undefined) {
          next[player.userId] = currentRoom.gameState.notes.hostByPlayerId?.[player.userId] ?? '';
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [currentRoom, isCurrentUserHost, selectedHostNotesPlayerId]);

  useEffect(() => {
    if (!isCurrentUserHost && activeUtilityPanel === 'notes') {
      setActiveUtilityPanel('room');
    }
  }, [activeUtilityPanel, isCurrentUserHost]);

  useLayoutEffect(() => {
    if (!currentRoom) {
      processedMoveKeyRef.current = undefined;
      processedMoveCountRef.current = 0;
      setAnimationMove(undefined);
      setAnimatedPlayerId(undefined);
      setSpecialFlow(undefined);
      setPendingDiceValues(undefined);
      setPendingMovePlan(undefined);
      setIsFlowCardReady(true);
      clearCardRevealTimer();
      lastTransitionEntryCellRef.current = undefined;
      return;
    }
    if (currentRoom.room.status !== 'in_progress') {
      processedMoveCountRef.current = currentRoom.gameState.moveHistory.length;
      processedMoveKeyRef.current = undefined;
      setPendingDiceValues(undefined);
      setPendingMovePlan(undefined);
      setAnimationMove(undefined);
      setSpecialFlow(undefined);
      setAnimatedPlayerId(undefined);
      setIsFlowCardReady(true);
      clearCardRevealTimer();
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
    const tokenPathCells = buildStepwiseCellPath(lastMove.fromCell, lastMove.dice, board.maxCell);

    const isSpecialFlow =
      (moveType === 'snake' || moveType === 'arrow')
      && Boolean(entryCell)
      && Boolean(pathPoints?.length)
      && entryCell !== lastMove.toCell;

    setAnimatedPlayerId(lastMove.userId);
    if (isSpecialFlow) {
      const entryTokenPath = tokenPathCells.filter((cell) => cell <= (entryCell ?? lastMove.toCell));
      setPendingMovePlan({
        moveKey,
        playerUserId: lastMove.userId,
        fromCell: lastMove.fromCell,
        toCell: entryCell!,
        type: null,
        tokenPathCells: entryTokenPath.length >= 2 ? entryTokenPath : [lastMove.fromCell, entryCell!],
        special: {
          headCell: entryCell!,
          tailCell: lastMove.toCell,
          type: moveType!,
          pathPoints,
        },
      });
      return;
    }
    setPendingMovePlan({
      moveKey,
      playerUserId: lastMove.userId,
      fromCell: lastMove.fromCell,
      toCell: lastMove.toCell,
      type: moveType,
      entryCell,
      pathPoints,
      tokenPathCells,
    });
  }, [clearCardRevealTimer, currentRoom]);

  useEffect(() => {
    if (!currentRoom || currentRoom.room.status === 'in_progress') {
      return;
    }
    setPendingDiceValues(undefined);
    setPendingMovePlan(undefined);
    setAnimationMove(undefined);
    setSpecialFlow(undefined);
    setAnimatedPlayerId(undefined);
  }, [currentRoom?.room.status]);

  const beginPendingMoveAnimation = useCallback(() => {
    if (currentRoom?.room.status !== 'in_progress') {
      setPendingMovePlan(undefined);
      setPendingDiceValues(undefined);
      return;
    }
    if (!pendingMovePlan) {
      return;
    }
    if (pendingMovePlan.special) {
      setSpecialFlow({
        moveId: pendingMovePlan.moveKey,
        playerUserId: pendingMovePlan.playerUserId,
        type: pendingMovePlan.special.type,
        headCell: pendingMovePlan.special.headCell,
        tailCell: pendingMovePlan.special.tailCell,
        pathPoints: pendingMovePlan.special.pathPoints,
        phase: 'entry-animation',
      });
      setAnimationMove({
        id: pendingMovePlan.moveKey,
        fromCell: pendingMovePlan.fromCell,
        toCell: pendingMovePlan.toCell,
        type: null,
        tokenPathCells: pendingMovePlan.tokenPathCells,
      });
      setPendingMovePlan(undefined);
      return;
    }
    setSpecialFlow(undefined);
    setAnimationMove({
      id: pendingMovePlan.moveKey,
      fromCell: pendingMovePlan.fromCell,
      toCell: pendingMovePlan.toCell,
      type: pendingMovePlan.type,
      entryCell: pendingMovePlan.entryCell,
      pathPoints: pendingMovePlan.pathPoints,
      tokenPathCells: pendingMovePlan.tokenPathCells,
    });
    setPendingMovePlan(undefined);
  }, [currentRoom?.room.status, pendingMovePlan]);

  const handleDiceAnimationFinished = useCallback(() => {
    setPendingDiceValues(undefined);
    beginPendingMoveAnimation();
  }, [beginPendingMoveAnimation]);

  useEffect(() => {
    if (previewCellNumber !== undefined || specialFlow) {
      return;
    }
    const activeCard = currentRoom?.gameState.activeCard;
    if (!activeCard || animationMove || pendingMovePlan) {
      revealedServerCardKeyRef.current = undefined;
      return;
    }
    const cardKey = `${activeCard.playerUserId}:${activeCard.cellNumber}`;
    if (revealedServerCardKeyRef.current === cardKey) {
      return;
    }
    revealedServerCardKeyRef.current = cardKey;
    scheduleCardReveal(ONLINE_CARD_TIMINGS_MS.serverSyncCard);
  }, [animationMove, currentRoom?.gameState.activeCard, pendingMovePlan, previewCellNumber, scheduleCardReveal, specialFlow]);

  const canShowCardModalForHaptics = Boolean(
    currentRoom
      && user
      && !animationMove
      && !pendingMovePlan
      && (previewCellNumber !== undefined || isFlowCardReady)
      && (
        previewCellNumber !== undefined
        || (currentRoom.gameState.activeCard && (isCurrentUserHost || currentRoom.gameState.activeCard.playerUserId === user.id))
      ),
  );

  useEffect(() => {
    if (canShowCardModalForHaptics && !cardVisibleRef.current) {
      playCardOpen();
    }
    cardVisibleRef.current = canShowCardModalForHaptics;
  }, [canShowCardModalForHaptics]);

  useEffect(() => () => {
    clearCardRevealTimer();
  }, [clearCardRevealTimer]);

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
  const hostControlledPlayers = playerEntries.filter((player) => player.controlMode === 'host');
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
  const hostPrivateNote = selectedHostNotesPlayerId ? (hostPrivateNotesDraftByPlayer[selectedHostNotesPlayerId] ?? '') : '';
  const hostPrivateSavedNotes = hostNotesPlayers
    .map((player) => ({
      player,
      text: currentRoom.gameState.notes.hostByPlayerId?.[player.userId]?.trim() ?? '',
    }))
    .filter((item) => item.text.length > 0);
  const primaryTokenPlayer = animatedPlayerId
    ? playerEntries.find((player) => player.userId === animatedPlayerId)
    : (isCurrentUserHost
      ? (currentTurnPlayer?.role === 'player' ? currentTurnPlayer : playerEntries[0])
      : selfPlayer);
  const primaryTokenCell = primaryTokenPlayer
    ? (currentRoom.gameState.perPlayerState[primaryTokenPlayer.userId]?.currentCell ?? 1)
    : 1;
  const boardPrimaryTokenCell = pendingMovePlan && primaryTokenPlayer && pendingMovePlan.playerUserId === primaryTokenPlayer.userId
    ? pendingMovePlan.fromCell
    : primaryTokenCell;
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

  const startSpecialTransition = () => {
    if (!specialFlow || specialFlow.phase !== 'entry-card') {
      return;
    }
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
  };

  const closeTargetSpecialCard = async () => {
    setSpecialFlow(undefined);
    setAnimatedPlayerId(undefined);
    if (activeCard) {
      await closeActiveCard();
    }
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
      startSpecialTransition();
      return;
    }
    if (specialFlow?.phase === 'target-card') {
      await closeTargetSpecialCard();
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
      startSpecialTransition();
      return;
    }
    if (specialFlow?.phase === 'target-card') {
      await closeTargetSpecialCard();
      return;
    }
    await closeActiveCard();
  };

  const hostCanPause = currentRoom.gameState.settings.hostCanPause;
  const holdBoardTokenSync = Boolean(animationMove) || Boolean(specialFlow);
  const canShowCardModal = Boolean(
    canSeeActiveCard
    && currentCellContent
    && activeCellNumber !== undefined
    && !animationMove
    && !pendingMovePlan
    && (isPreviewCardOpen || isFlowCardReady),
  );

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
  const canRollCurrentPlayer = !isCurrentUserHost
    && currentRoom.room.status === 'in_progress'
    && isMyTurn
    && !animationMove
    && !pendingMovePlan
    && !currentRoom.gameState.activeCard
    && !isRolling;
  const canRollHostTarget = Boolean(
    hostRollTargetId
      && currentRoom.room.status === 'in_progress'
      && currentTurnPlayer?.userId === hostRollTargetId
      && currentTurnPlayer?.role === 'player'
      && !animationMove
      && !pendingMovePlan
      && !currentRoom.gameState.activeCard
      && !isRolling,
  );
  const utilityTabs: { id: UtilityPanelId; label: string }[] = [
    { id: 'room', label: isCurrentUserHost ? 'Кімната' : 'Меню' },
    { id: 'players', label: 'Учасники' },
    { id: 'history', label: 'Ходи' },
    ...(isCurrentUserHost ? [{ id: 'notes' as const, label: 'Нотатки' }] : []),
  ];
  const currentFocusTitle = currentCellContent?.title ?? `Клітина ${boardPrimaryTokenCell}`;
  const utilityTabsGridClassName = 'grid-cols-2';
  const utilityTabsNav = (
    <div className={`lila-segmented text-xs ${utilityTabsGridClassName}`}>
      {utilityTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveUtilityPanel(tab.id)}
          className="lila-segmented-button"
          data-active={activeUtilityPanel === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const roomPanelContent = (
    <div className="space-y-3">
      <section className="lila-list-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lila-utility-label">Кімната</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--lila-text-primary)]">Код {currentRoom.room.code}</h2>
          </div>
          <Link
            to="/"
            onClick={clearCurrentRoom}
            className="lila-secondary-button px-3 py-2 text-xs font-medium"
          >
            Вийти
          </Link>
        </div>

        <dl className="mt-4 grid gap-2 text-sm">
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
        </dl>
      </section>

      <section className="lila-list-card p-4">
        <p className="lila-utility-label">Запрошення</p>
        <p className="mt-2 break-all text-xs leading-5 text-[var(--lila-text-muted)]">{joinLink}</p>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={() => {
              void copyInviteLink();
            }}
            className="lila-primary-button px-4 py-3 text-sm font-semibold"
          >
            {inviteCopied ? 'Посилання скопійовано' : 'Скопіювати посилання'}
          </button>
          <button
            type="button"
            onClick={openInviteInTelegram}
            className="lila-secondary-button px-4 py-3 text-sm font-medium"
          >
            Відкрити invite в Telegram
          </button>
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={botInviteUrl}
              target="_blank"
              rel="noreferrer"
              className="lila-secondary-button px-3 py-2.5 text-center text-xs font-medium"
            >
              Bot: @{BOT_USERNAME}
            </a>
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noreferrer"
              className="lila-secondary-button px-3 py-2.5 text-center text-xs font-medium"
            >
              Канал про гру
            </a>
          </div>
        </div>
      </section>

      {isCurrentUserHost && (
        <section className="lila-list-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lila-utility-label">Керуйте сесією</p>
              <h3 className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Ритм кімнати</h3>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void hostStartGame()}
              disabled={currentRoom.room.status === 'in_progress'}
              className="lila-primary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Почати гру
            </button>
            <button
              type="button"
              onClick={() => void hostPauseGame()}
              disabled={!hostCanPause || currentRoom.room.status !== 'in_progress'}
              className="lila-secondary-button px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Пауза
            </button>
            <button
              type="button"
              onClick={() => void hostResumeGame()}
              disabled={currentRoom.room.status !== 'paused'}
              className="lila-secondary-button px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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
              className="rounded-[18px] border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {finishRequested ? 'Завершуємо...' : 'Завершити кімнату'}
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--lila-border-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">
              <span>Ведучий може закривати будь-яку картку</span>
              <input
                type="checkbox"
                checked={currentRoom.gameState.settings.allowHostCloseAnyCard}
                onChange={(event) => {
                  void hostUpdateSettings({ allowHostCloseAnyCard: event.target.checked });
                }}
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--lila-border-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">
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
        </section>
      )}

      <section className="lila-list-card p-4">
        <p className="lila-utility-label">Вигляд</p>
        <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">
          Локальна тема та атмосфера для цього клієнта, без дублювання на головному полотні.
        </p>
        <button
          type="button"
          onClick={() => setShowAppearanceModal(true)}
          className="lila-secondary-button mt-3 w-full px-4 py-3 text-sm font-medium"
        >
          Відкрити appearance studio
        </button>
      </section>

      {currentRoom.room.status === 'finished' && (
        <section className="rounded-[22px] border border-emerald-300/60 bg-emerald-50/75 p-4">
          <h3 className="text-base font-semibold text-emerald-900">Кімнату завершено</h3>
          <p className="mt-1 text-sm text-emerald-900/80">
            Сесію закрито. Нові гравці більше не можуть приєднатися.
          </p>
        </section>
      )}
    </div>
  );

  const playersPanelContent = (
    <div className="space-y-3">
      <section className="lila-list-card p-4">
        <p className="lila-utility-label">Моя фішка</p>
        <h2 className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Колір токена</h2>
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
      </section>

      {isCurrentUserHost && (
        <section className="lila-list-card p-4">
          <p className="lila-utility-label">Host-controlled</p>
          <h3 className="mt-2 text-base font-semibold text-[var(--lila-text-primary)]">Додайте гравця</h3>
          <div className="mt-3 flex gap-2">
            <input
              value={hostControlledDraftName}
              onChange={(event) => setHostControlledDraftName(event.target.value)}
              placeholder="Імʼя гравця"
              className="lila-field min-w-0 flex-1 px-3 py-3 text-sm text-[var(--lila-text-primary)]"
            />
            <button
              type="button"
              onClick={() => {
                const name = hostControlledDraftName.trim();
                if (!name) {
                  return;
                }
                void addHostControlledPlayer(name).then(() => setHostControlledDraftName(''));
              }}
              className="lila-primary-button px-4 py-3 text-sm font-semibold"
            >
              Додати
            </button>
          </div>
          {hostControlledPlayers.length > 0 && (
            <p className="mt-2 text-xs leading-5 text-[var(--lila-text-muted)]">
              Активні: {hostControlledPlayers.map((player) => player.displayName).join(', ')}
            </p>
          )}
        </section>
      )}

      <section className="lila-list-card p-4">
        <p className="lila-utility-label">Учасники</p>
        <ul className="mt-3 space-y-2">
          {currentRoom.players.map((player) => {
            const playerState = currentRoom.gameState.perPlayerState[player.userId];
            const isCurrent = player.userId === currentRoom.gameState.currentTurnPlayerId;
            return (
              <li key={player.userId} className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--lila-text-primary)]">
                      {player.displayName}
                      {isCurrent ? ' · Хід зараз' : ''}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--lila-text-muted)]">
                      {player.role === 'host'
                        ? `Ведучий · Без фішки · ${player.connectionStatus}`
                        : `${player.controlMode === 'host' ? 'Host-controlled' : 'Self'} · Клітина ${playerState?.currentCell ?? 1} · ${player.connectionStatus}`}
                    </p>
                  </div>
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-white/70"
                    style={{ backgroundColor: player.tokenColor }}
                  />
                </div>
                {player.role === 'player' && player.controlMode === 'host' && (
                  <p className="mt-2 inline-flex rounded-full bg-[var(--lila-accent-soft)] px-2 py-0.5 text-[11px] text-[var(--lila-chip-active-text)]">
                    Керується ведучим
                  </p>
                )}
                {isCurrentUserHost && player.role === 'player' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={board.maxCell}
                      value={hostMoveCellDraftByPlayer[player.userId] ?? (playerState?.currentCell ?? 1)}
                      onChange={(event) => {
                        const next = Number.parseInt(event.target.value, 10);
                        setHostMoveCellDraftByPlayer((previous) => ({
                          ...previous,
                          [player.userId]: Number.isFinite(next) ? next : 1,
                        }));
                      }}
                      className="lila-field min-w-0 flex-1 px-3 py-2 text-xs text-[var(--lila-text-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void hostSetPlayerCell(
                          player.userId,
                          hostMoveCellDraftByPlayer[player.userId] ?? (playerState?.currentCell ?? 1),
                        );
                      }}
                      className="lila-secondary-button px-3 py-2 text-xs font-medium"
                    >
                      Set cell
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );

  const historyPanelContent = (
    <div className="space-y-3">
      <section className="lila-list-card p-4">
        <p className="lila-utility-label">Останній рух</p>
        <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">{hostMoveSummary}</p>
      </section>
      <section className="lila-list-card p-4">
        <p className="lila-utility-label">Історія ходів</p>
        <ul className="mt-3 space-y-2">
          {currentRoom.gameState.moveHistory.length === 0 ? (
            <li className="text-sm text-[var(--lila-text-muted)]">Ще немає кидків у цій сесії.</li>
          ) : (
            currentRoom.gameState.moveHistory.slice(-12).reverse().map((move) => {
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
            })
          )}
        </ul>
      </section>
    </div>
  );

  const notesPanelContent = (
    <section className="lila-list-card p-4">
      <p className="lila-utility-label">Приватні нотатки ведучого</p>
      <p className="mt-2 text-sm leading-6 text-[var(--lila-text-muted)]">Видимі лише вам, не показуються гравцям.</p>
      {hostNotesPlayers.length > 0 ? (
        <>
          <select
            value={selectedHostNotesPlayerId}
            onChange={(event) => {
              setSelectedHostNotesPlayerId(event.target.value);
            }}
            className="lila-select mt-3 px-3 py-3 text-sm text-[var(--lila-text-primary)]"
          >
            {hostNotesPlayers.map((player) => (
              <option key={player.userId} value={player.userId}>
                {player.displayName}
              </option>
            ))}
          </select>
          <textarea
            value={hostPrivateNote}
            onChange={(event) => {
              if (!selectedHostNotesPlayerId) {
                return;
              }
              const nextValue = event.target.value;
              setHostPrivateNotesDraftByPlayer((previous) => ({
                ...previous,
                [selectedHostNotesPlayerId]: nextValue,
              }));
            }}
            placeholder="Спостереження, реакції, фокус для ведення..."
            className="lila-textarea mt-3 min-h-28 px-3 py-3 text-sm leading-6 text-[var(--lila-text-primary)]"
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
                  setHostPrivateNotesDraftByPlayer((previous) => ({
                    ...previous,
                    [selectedHostNotesPlayerId]: hostPrivateNote,
                  }));
                  window.setTimeout(() => setHostNoteStatus('idle'), 1400);
                })
                .catch(() => {
                  setHostNoteStatus('error');
                });
            }}
            className="lila-primary-button mt-3 w-full px-4 py-3 text-sm font-semibold"
          >
            {hostNoteStatus === 'saving' ? 'Збереження...' : 'Зберегти нотатку ведучого'}
          </button>
          {hostNoteStatus === 'saved' && (
            <p className="mt-2 text-xs text-emerald-700">Нотатку збережено.</p>
          )}
          {hostNoteStatus === 'error' && (
            <p className="mt-2 text-xs text-rose-700">Не вдалося зберегти нотатку.</p>
          )}
          <div className="mt-3 rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--lila-text-muted)]">Збережені нотатки</p>
            {hostPrivateSavedNotes.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--lila-text-muted)]">Поки немає збережених нотаток.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {hostPrivateSavedNotes.map(({ player, text }) => (
                  <li key={player.userId} className="text-xs text-[var(--lila-text-primary)]">
                    <span className="font-semibold">{player.displayName}:</span>{' '}
                    <span className="text-[var(--lila-text-muted)]">{text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Зʼявиться, коли в кімнаті буде хоча б один гравець.</p>
      )}
    </section>
  );

  const utilityPanelContent = activeUtilityPanel === 'room'
    ? roomPanelContent
    : activeUtilityPanel === 'players'
      ? playersPanelContent
      : activeUtilityPanel === 'history'
        ? historyPanelContent
        : notesPanelContent;

  const currentTurnLabel = currentTurnPlayer?.displayName ?? '—';
  const lastDiceSummary = !lastDiceRoll
    ? 'Без кидків'
    : `${currentRoom.players.find((player) => player.userId === lastDiceRoll.playerId)?.displayName ?? 'Гравець'} · ${lastDiceRoll.diceValues.join(' + ')} = ${lastDiceRoll.dice}`;
  const onlineRules = [
    'Ведучий кидає за будь-якого гравця.',
    'У черзі лише гравці, кожен чекає свого ходу.',
    'Новий кидок тільки після закриття активної картки.',
  ];
  const nextActionLabel = isCurrentUserHost
    ? (currentRoom.room.status === 'open'
      ? 'Почніть спільну сесію'
      : currentRoom.room.status === 'paused'
        ? 'Поверніть гру в ритм'
        : canRollHostTarget
          ? `Кинути за ${currentTurnPlayer?.displayName ?? 'гравця'}`
          : `Хід: ${currentTurnLabel}`)
    : (isMyTurn ? 'Ваш хід' : `Хід: ${currentTurnLabel}`);

  const primaryAction = (() => {
    if (isCurrentUserHost) {
      if (currentRoom.room.status === 'open') {
        return {
          label: 'Почати гру',
          shortLabel: 'Почати',
          disabled: false,
          onClick: () => void hostStartGame(),
        };
      }
      if (currentRoom.room.status === 'paused') {
        return {
          label: 'Продовжити гру',
          shortLabel: 'Продовжити',
          disabled: false,
          onClick: () => void hostResumeGame(),
        };
      }
      if (currentRoom.room.status === 'in_progress' && playerEntries.length > 0) {
        return {
          label: isRolling ? 'Кидаємо…' : 'Кинути за гравця',
          shortLabel: isRolling ? 'Кидаємо…' : 'Кинути',
          disabled: !hostRollTargetId || !canRollHostTarget || isRolling,
          onClick: () => {
            if (!hostRollTargetId || !canRollHostTarget) {
              return;
            }
            setIsRolling(true);
            void rollDice(hostRollTargetId).finally(() => setIsRolling(false));
          },
        };
      }
      return undefined;
    }

    return {
      label: isRolling ? 'Кидаємо…' : 'Кинути кубик',
      shortLabel: isRolling ? 'Кидаємо…' : 'Кинути',
      disabled: !canRollCurrentPlayer || isRolling,
      onClick: () => {
        if (!canRollCurrentPlayer) {
          return;
        }
        setIsRolling(true);
        void rollDice().finally(() => setIsRolling(false));
      },
    };
  })();

  const boardHeader = (
    <header className="space-y-1 px-0.5 pb-0.5">
      {error && (
        <p className="rounded-[18px] border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="lila-canva-topbar items-start px-1.5 py-1.5 sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="lila-utility-label">Host Room</p>
          <h1 className="mt-1 text-[clamp(1.15rem,1.7vw,1.8rem)] font-black uppercase tracking-[-0.05em] text-[var(--lila-text-primary)]">
            {currentFocusTitle}
          </h1>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <span className="lila-badge">Код {currentRoom.room.code}</span>
          <span className="lila-badge">{roomStatusLabel[currentRoom.room.status]}</span>
          <button
            type="button"
            onClick={() => openUtilityPanel('room')}
            className="lila-secondary-button px-3 py-2 text-xs font-medium min-[1120px]:hidden"
          >
            Меню
          </button>
          <Link
            to="/"
            onClick={clearCurrentRoom}
            className="lila-secondary-button px-3 py-2 text-xs font-medium"
          >
            Вийти
          </Link>
        </div>
      </div>

      <div className="grid gap-2 px-0.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <section className="lila-panel-muted min-w-0 p-3">
          <p className="lila-utility-label">Правила online</p>
          <div className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--lila-text-primary)] sm:text-sm">
            {onlineRules.map((rule) => (
              <p key={rule}>{rule}</p>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2 sm:max-w-[20rem] sm:justify-end">
          <span className="lila-badge">Хід: {currentTurnLabel}</span>
          <span className="lila-badge">{lastDiceSummary}</span>
          {activeCard ? (
            <span className="lila-badge">Відкрита картка · {activeCard.cellNumber}</span>
          ) : null}
        </div>
      </div>
    </header>
  );

  const boardStage = (
    <div className="flex h-full w-full items-center justify-center">
      <LilaBoard
        board={board}
        currentCell={boardPrimaryTokenCell}
        otherTokens={boardOtherTokens}
        tokenColor={primaryTokenPlayer?.tokenColor}
        animationMove={animationMove}
        animationTimings={DEFAULT_ANIMATION_TIMINGS}
        movementSettings={movementSettings}
        onMoveAnimationComplete={() => {
          if (specialFlow?.phase === 'entry-animation') {
            setAnimationMove(undefined);
            setSpecialFlow((prev) => (prev ? { ...prev, phase: 'entry-card' } : prev));
            scheduleCardReveal(ONLINE_CARD_TIMINGS_MS.beforeSpecialEntryCard);
            return;
          }
          if (specialFlow?.phase === 'special-animation') {
            setAnimationMove(undefined);
            setSpecialFlow((prev) => (prev ? { ...prev, phase: 'target-card' } : prev));
            scheduleCardReveal(ONLINE_CARD_TIMINGS_MS.beforeSpecialTargetCard);
            return;
          }
          setAnimationMove(undefined);
          setAnimatedPlayerId(undefined);
          scheduleCardReveal(ONLINE_CARD_TIMINGS_MS.afterStepMove);
        }}
        onCellSelect={(cellNumber) => {
          setPreviewCellNumber(cellNumber);
        }}
        holdTokenSync={holdBoardTokenSync}
      />
    </div>
  );

  const controlsPanel = (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <section className="lila-paper-card p-3">
        <p className="lila-utility-label">Наступна дія</p>
        <h2 className="mt-2 text-lg font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">
          {nextActionLabel}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="lila-badge">{connectionState}</span>
          {currentRoom.room.status === 'finished' ? <span className="lila-badge">Сесію завершено</span> : null}
        </div>

        {isCurrentUserHost && playerEntries.length > 0 && currentRoom.room.status === 'in_progress' && (
          <select
            value={hostRollTargetId}
            onChange={(event) => setHostRollTargetId(event.target.value)}
            className="lila-select mt-3 px-3 py-3 text-sm text-[var(--lila-text-primary)]"
          >
            {playerEntries.map((player) => (
              <option key={player.userId} value={player.userId}>
                {player.displayName}
              </option>
            ))}
          </select>
        )}

        {isCurrentUserHost && playerEntries.length > 0 && currentRoom.room.status === 'in_progress' && (
          <p className="mt-2 text-xs leading-5 text-[var(--lila-text-muted)]">
            Ведучий може кинути за будь-якого гравця, але хід спрацює тільки коли цей гравець активний у черзі.
          </p>
        )}

        {primaryAction ? (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="lila-primary-button mt-3 w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {primaryAction.label}
          </button>
        ) : (
          <p className="mt-3 rounded-[18px] border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--lila-text-muted)]">
            {isCurrentUserHost
              ? 'Основна дія зараз у гравця або відкриється після зміни статусу кімнати.'
              : 'Чекайте свого ходу або відкрийте меню кімнати для деталей.'}
          </p>
        )}

        {isCurrentUserHost && currentRoom.room.status === 'in_progress' && hostCanPause && (
          <button
            type="button"
            onClick={() => void hostPauseGame()}
            className="lila-secondary-button mt-2 w-full px-4 py-3 text-sm font-medium"
          >
            Пауза
          </button>
        )}

        <div className="relative z-10 mt-3">
          <Dice3D
            rollToken={diceRollToken}
            diceValues={pendingDiceValues}
            onResult={() => {}}
            onFinished={handleDiceAnimationFinished}
          />
        </div>
      </section>

      <section className="lila-list-card p-3">
        <p className="lila-utility-label">Меню кімнати</p>
        <div className="mt-2 grid gap-2">
          {utilityTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => openUtilityPanel(tab.id)}
              className="lila-secondary-button px-3 py-2.5 text-sm font-medium"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>
    </section>
  );

  const mobileControls = (
    <section className="flex flex-col gap-1.5">
      {isCurrentUserHost && playerEntries.length > 0 && currentRoom.room.status === 'in_progress' ? (
        <select
          value={hostRollTargetId}
          onChange={(event) => setHostRollTargetId(event.target.value)}
          className="lila-select px-3 py-2.5 text-sm text-[var(--lila-text-primary)]"
        >
          {playerEntries.map((player) => (
            <option key={player.userId} value={player.userId}>
              {player.displayName}
            </option>
          ))}
        </select>
      ) : null}

      <section className="lila-panel-muted flex items-center gap-2 px-2.5 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="lila-utility-label">Host Room</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-[var(--lila-text-primary)]">
            {nextActionLabel}
          </p>
        </div>

        {primaryAction ? (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="lila-primary-button shrink-0 px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {primaryAction.shortLabel}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => openUtilityPanel('room')}
          className="lila-secondary-button shrink-0 px-3 py-2.5 text-sm font-medium"
        >
          Меню
        </button>
      </section>
    </section>
  );

  return (
    <>
      <GameBoardLayout
        header={boardHeader}
        board={boardStage}
        controls={controlsPanel}
        mobileControls={mobileControls}
      />

      <CompactPanelModal
        open={showUtilityModal}
        eyebrow="Host Room"
        title={`Кімната ${currentRoom.room.code}`}
        onClose={() => setShowUtilityModal(false)}
      >
        {utilityTabsNav}
        <div className="mt-4">
          {utilityPanelContent}
        </div>
      </CompactPanelModal>

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
              if (specialFlow?.phase === 'entry-card') {
                startSpecialTransition();
                return;
              }
              if (specialFlow?.phase === 'target-card') {
                void closeTargetSpecialCard();
                return;
              }
              if (!isPreviewCardOpen && activeCard) {
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

      <AnimatePresence>
        {showAppearanceModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-3">
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
