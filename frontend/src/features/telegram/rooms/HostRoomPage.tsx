import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BOARD_DEFINITIONS } from '../../../content/boards';
import { LilaBoard } from '../../../components/lila/LilaBoard';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { useTelegramRooms } from './TelegramRoomsContext';

export const HostRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useTelegramAuth();
  const {
    currentRoom,
    isLoading,
    error,
    loadRoomById,
    hostStartGame,
    hostFinishGame,
    rollDice,
    currentUserRole,
    isMyTurn,
    connectionState,
  } = useTelegramRooms();

  useEffect(() => {
    if (!roomId) {
      return;
    }
    if (currentRoom?.room.id === roomId) {
      return;
    }
    void loadRoomById(roomId);
  }, [currentRoom?.room.id, loadRoomById, roomId]);

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
  const selfState = user ? currentRoom.gameState.perPlayerState[user.id] : undefined;
  const currentTurnPlayer = currentRoom.players.find((entry) => entry.userId === currentRoom.gameState.currentTurnPlayerId);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[var(--lila-bg-main)] px-3 py-4">
      <section className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--lila-text-muted)]">Host Room</p>
            <h1 className="text-xl font-semibold text-[var(--lila-text-primary)]">
              Код: {currentRoom.room.code}
            </h1>
          </div>
          <Link to="/" className="rounded-lg border border-[var(--lila-border-soft)] px-3 py-1.5 text-sm">Вийти</Link>
        </div>
        <p className="mt-2 text-sm text-[var(--lila-text-muted)]">
          Статус: {currentRoom.room.status} · Connection: {connectionState}
        </p>
        <p className="text-sm text-[var(--lila-text-muted)]">
          Поточний хід: <span className="font-semibold text-[var(--lila-text-primary)]">{currentTurnPlayer?.displayName ?? '—'}</span>
        </p>
      </section>

      <div className="mt-3">
        <LilaBoard
          board={board}
          currentCell={selfState?.currentCell ?? 1}
          otherTokens={currentRoom.players
            .filter((player) => player.userId !== user?.id)
            .map((player) => ({
              id: player.userId,
              cell: currentRoom.gameState.perPlayerState[player.userId]?.currentCell ?? 1,
              color: player.tokenColor,
            }))}
          tokenColor={currentRoom.players.find((player) => player.userId === user?.id)?.tokenColor}
          disableCellSelect
        />
      </div>

      <section className="mt-3 rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--lila-text-muted)]">Гравці</h2>
        <ul className="mt-2 space-y-2">
          {currentRoom.players.map((player) => (
            <li key={player.userId} className="flex items-center justify-between rounded-xl border border-[var(--lila-border-soft)] px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[var(--lila-text-primary)]">{player.displayName}</p>
                <p className="text-xs text-[var(--lila-text-muted)]">
                  Клітина {currentRoom.gameState.perPlayerState[player.userId]?.currentCell ?? 1} · {player.role}
                </p>
              </div>
              <span
                className="h-3 w-3 rounded-full border border-white/70"
                style={{ backgroundColor: player.tokenColor }}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-3 rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => void rollDice()}
            disabled={!isMyTurn || currentRoom.room.status !== 'in_progress'}
            className="rounded-xl bg-[var(--lila-accent)] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            Кинути кубик
          </button>
          <button
            type="button"
            onClick={() => void hostStartGame()}
            disabled={currentUserRole !== 'host' || currentRoom.room.status === 'in_progress'}
            className="rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-4 py-3 text-sm disabled:opacity-50"
          >
            Почати гру
          </button>
          <button
            type="button"
            onClick={() => void hostFinishGame()}
            disabled={currentUserRole !== 'host'}
            className="rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-4 py-3 text-sm disabled:opacity-50"
          >
            Завершити кімнату
          </button>
        </div>
      </section>

      {error && (
        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
    </main>
  );
};
