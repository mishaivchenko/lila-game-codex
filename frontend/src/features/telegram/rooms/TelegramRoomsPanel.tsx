import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { useTelegramRooms } from './TelegramRoomsContext';

export const TelegramRoomsPanel = () => {
  const navigate = useNavigate();
  const { status, isTelegramMode } = useTelegramAuth();
  const { currentRoom, isLoading, error, createRoom, joinRoomByCode, connectionState } = useTelegramRooms();
  const [roomCodeInput, setRoomCodeInput] = useState('');

  if (!isTelegramMode) {
    return null;
  }

  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    if (!roomCodeInput.trim()) {
      return;
    }
    void joinRoomByCode(roomCodeInput).then((snapshot) => {
      if (snapshot?.room.id) {
        navigate(`/host-room/${snapshot.room.id}`);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_12px_28px_rgba(89,66,54,0.12)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lila-text-muted)]">Host Room Online</p>
      <h3 className="mt-1 text-base font-semibold text-[var(--lila-text-primary)]">Спільна подорож</h3>
      <p className="mt-1 text-xs text-[var(--lila-text-muted)]">
        Хост керує простором, але кожен гравець кидає власний кубик.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={() => {
            void createRoom('full').then((snapshot) => {
              if (snapshot?.room.id) {
                navigate(`/host-room/${snapshot.room.id}`);
              }
            });
          }}
          disabled={status !== 'authenticated' || isLoading}
          className="rounded-xl bg-[var(--lila-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--lila-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Створити Host Room
        </button>

        <form onSubmit={submitJoin} className="flex gap-2">
          <input
            value={roomCodeInput}
            onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
            maxLength={8}
            placeholder="Код кімнати"
            className="min-w-0 flex-1 rounded-xl border border-[var(--lila-input-border)] bg-[var(--lila-input-bg)] px-3 py-2 text-sm text-[var(--lila-text-primary)] outline-none focus:border-[var(--lila-accent)]"
          />
          <button
            type="submit"
            disabled={status !== 'authenticated' || isLoading}
            className="rounded-xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-2 text-sm text-[var(--lila-text-primary)] disabled:opacity-50"
          >
            Join
          </button>
        </form>
      </div>

      {currentRoom && (
        <div className="mt-3 rounded-xl bg-[var(--lila-accent-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">
          <p>
            Кімната: <span className="font-semibold tracking-wider">{currentRoom.room.code}</span>
          </p>
          <p className="text-xs text-[var(--lila-text-muted)]">Стан зʼєднання: {connectionState}</p>
          <button
            type="button"
            onClick={() => navigate(`/host-room/${currentRoom.room.id}`)}
            className="mt-2 rounded-lg border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-3 py-1.5 text-xs font-medium"
          >
            Відкрити кімнату
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </section>
  );
};
