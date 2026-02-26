import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BOARD_DEFINITIONS } from '../../../content/boards';
import { AppearanceCustomizationPanel } from '../../../components/AppearanceCustomizationPanel';
import { CellCoachModal } from '../../../components/CellCoachModal';
import { LilaBoard } from '../../../components/lila/LilaBoard';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { ROOM_TOKEN_COLOR_PALETTE } from './roomsApi';
import { useTelegramRooms } from './TelegramRoomsContext';

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
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useTelegramAuth();
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
    currentUserRole,
    isMyTurn,
    connectionState,
    lastDiceRoll,
  } = useTelegramRooms();
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    if (!roomId) {
      return;
    }
    if (currentRoom?.room.id === roomId) {
      return;
    }
    void loadRoomById(roomId);
  }, [currentRoom?.room.id, loadRoomById, roomId]);

  useEffect(() => {
    if (!inviteCopied) {
      return undefined;
    }
    const timer = window.setTimeout(() => setInviteCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [inviteCopied]);

  if (!roomId) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
        <p className="text-sm text-[var(--lila-text-muted)]">Room id is missing.</p>
        <Link to="/" className="text-sm underline">Back home</Link>
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
  const selfState = user ? currentRoom.gameState.perPlayerState[user.id] : undefined;
  const currentTurnPlayer = currentRoom.players.find((entry) => entry.userId === currentRoom.gameState.currentTurnPlayerId);
  const activeCard = currentRoom.gameState.activeCard;
  const canSeeActiveCard = Boolean(
    activeCard
      && user
      && (currentUserRole === 'host' || activeCard.playerUserId === user.id),
  );
  const activePlayer = activeCard
    ? currentRoom.players.find((player) => player.userId === activeCard.playerUserId)
    : undefined;
  const currentCellContent = activeCard ? board.cells[activeCard.cellNumber - 1] : undefined;
  const activeCellNumber = activeCard?.cellNumber;
  const noteScope = currentUserRole === 'host' ? 'host' : 'player';
  const initialModalText = (() => {
    if (!activeCellNumber || !user) {
      return '';
    }
    if (currentUserRole === 'host') {
      return currentRoom.gameState.notes.hostByCell[String(activeCellNumber)] ?? '';
    }
    return currentRoom.gameState.notes.playerByUserId[user.id]?.[String(activeCellNumber)] ?? '';
  })();
  const joinLink = `${window.location.origin}/host-room/${currentRoom.room.id}`;
  const boardOtherTokens = currentRoom.players
    .filter((player) => player.userId !== user?.id)
    .map((player) => ({
      id: player.userId,
      cell: currentRoom.gameState.perPlayerState[player.userId]?.currentCell ?? 1,
      color: player.tokenColor,
    }));

  const hostMoveSummary = useMemo(() => {
    if (!lastDiceRoll) {
      return 'Ще немає кидків у цій сесії.';
    }
    const movedPlayer = currentRoom.players.find((player) => player.userId === lastDiceRoll.playerId);
    return `${movedPlayer?.displayName ?? 'Гравець'} кинув ${lastDiceRoll.diceValues.join(' + ')} = ${lastDiceRoll.dice}`;
  }, [currentRoom.players, lastDiceRoll]);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setInviteCopied(true);
    } catch {
      setInviteCopied(false);
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
    await closeActiveCard();
  };

  const handleCardSkip = async () => {
    await closeActiveCard();
  };

  const hostCanPause = currentRoom.gameState.settings.hostCanPause;

  return (
    <main className="mx-auto min-h-screen max-w-[1460px] bg-[var(--lila-bg-main)] px-3 py-4 sm:px-4 lg:px-5">
      <div className="grid gap-4 xl:grid-cols-[320px,minmax(0,1fr),320px]">
        <aside className="space-y-4">
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
              </div>
            </dl>
          </section>

          {currentUserRole === 'host' && (
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
                  onClick={() => void hostFinishGame()}
                  className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  Завершити кімнату
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
                        className={`rounded-2xl border px-3 py-2 text-sm ${
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
            </section>
          )}

          <AppearanceCustomizationPanel
            defaultExpanded={false}
            title={currentUserRole === 'host' ? 'Ваш локальний вигляд та атмосферa' : 'Мої локальні налаштування'}
          />
        </aside>

        <section className="space-y-4">
          <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-3 shadow-[0_18px_48px_rgba(42,36,31,0.12)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Shared Board</p>
                <h2 className="text-lg font-semibold text-[var(--lila-text-primary)]">
                  {currentUserRole === 'host' ? 'Поле ведучого' : 'Спільна дошка'}
                </h2>
              </div>
              <div className="rounded-full bg-[var(--lila-surface-muted)] px-3 py-1.5 text-xs text-[var(--lila-text-primary)]">
                {hostMoveSummary}
              </div>
            </div>

            <LilaBoard
              board={board}
              currentCell={selfState?.currentCell ?? 1}
              otherTokens={boardOtherTokens}
              tokenColor={selfPlayer?.tokenColor}
              disableCellSelect
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
              <button
                type="button"
                onClick={() => void rollDice()}
                disabled={!isMyTurn || currentRoom.room.status !== 'in_progress'}
                className="rounded-2xl bg-[var(--lila-accent)] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Кинути кубики
              </button>
            </div>
            <p className="mt-2 text-sm text-[var(--lila-text-muted)]">
              Гравці самі кидають кубики. Ведучий утримує простір і може ставити кімнату на паузу без втрати стану.
            </p>
          </section>
        </section>

        <aside className="space-y-4">
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
                          {player.role === 'host' ? 'Ведучий' : 'Гравець'} · Клітина {playerState?.currentCell ?? 1} · {player.connectionStatus}
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
        </aside>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <AnimatePresence>
        {canSeeActiveCard && currentCellContent && activeCard && (
          <CellCoachModal
            cellNumber={activeCard.cellNumber}
            cellContent={currentCellContent}
            depth="standard"
            initialText={initialModalText}
            onSave={(text) => {
              void handleCardSave(text);
            }}
            onSkip={() => {
              void handleCardSkip();
            }}
            onClose={() => {
              void closeActiveCard();
            }}
            moveContext={{
              fromCell: currentRoom.gameState.moveHistory.at(-1)?.fromCell ?? activeCard.cellNumber,
              toCell: activeCard.cellNumber,
              type: currentRoom.gameState.moveHistory.at(-1)?.snakeOrArrow === 'snake'
                ? 'snake'
                : currentRoom.gameState.moveHistory.at(-1)?.snakeOrArrow === 'arrow'
                  ? 'ladder'
                  : 'normal',
            }}
          />
        )}
      </AnimatePresence>

      {currentUserRole === 'host' && activeCard && activePlayer && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-40 hidden rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 px-4 py-3 shadow-lg lg:block">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--lila-text-muted)]">Відкрита картка</p>
          <p className="text-sm font-semibold text-[var(--lila-text-primary)]">
            Клітина {activeCard.cellNumber} · {activePlayer.displayName}
          </p>
        </div>
      )}
    </main>
  );
};
