import { useState, type FormEvent } from 'react';
import { useTelegramAuth } from '../auth/TelegramAuthContext';
import { useTelegramRooms } from './TelegramRoomsContext';

export const TelegramRoomsPanel = () => {
  const { status, isTelegramMode } = useTelegramAuth();
  const { currentRoom, isLoading, error, createRoom, joinRoomByCode } = useTelegramRooms();
  const [roomCodeInput, setRoomCodeInput] = useState('');

  if (!isTelegramMode) {
    return null;
  }

  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    if (!roomCodeInput.trim()) {
      return;
    }
    void joinRoomByCode(roomCodeInput);
  };

  return (
    <section className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/95 p-4 shadow-[0_12px_28px_rgba(89,66,54,0.12)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lila-text-muted)]">Telegram Rooms</p>
      <h3 className="mt-1 text-base font-semibold text-[var(--lila-text-primary)]">Підготовка до спільної гри</h3>
      <p className="mt-1 text-xs text-[var(--lila-text-muted)]">
        Створіть код кімнати або приєднайтесь до існуючої. Повний мультиплеєр зʼявиться в наступних релізах.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={() => {
            void createRoom();
          }}
          disabled={status !== 'authenticated' || isLoading}
          className="rounded-xl bg-[var(--lila-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--lila-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Створити кімнату
        </button>

        <form onSubmit={submitJoin} className="flex gap-2">
          <input
            value={roomCodeInput}
            onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
            maxLength={8}
            placeholder="Код"
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
        <p className="mt-3 rounded-xl bg-[var(--lila-accent-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">
          Активна кімната: <span className="font-semibold tracking-wider">{currentRoom.code}</span>
        </p>
      )}

      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </section>
  );
};
