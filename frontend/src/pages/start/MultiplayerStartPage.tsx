import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TelegramRoomsPanel, useTelegramAuth } from '../../features/telegram';
import { useTelegramRooms } from '../../features/telegram/rooms/TelegramRoomsContext';

const PAGE_SIZE = 5;

export const MultiplayerStartPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isTelegramMode, status } = useTelegramAuth();
  const { myRooms, refreshMyRooms, error } = useTelegramRooms();

  const [initialRoomCode] = useState(() => searchParams.get('roomCode') ?? undefined);
  const [initialRoomId] = useState(() => searchParams.get('roomId') ?? undefined);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isTelegramMode || status !== 'authenticated') {
      return;
    }
    void refreshMyRooms();
  }, [isTelegramMode, refreshMyRooms, status]);

  const pagedRooms = useMemo(
    () => myRooms.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [myRooms, page],
  );

  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < myRooms.length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-6 shadow-[0_18px_44px_rgba(42,36,31,0.14)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--lila-text-muted)]">Гра з іншими</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--lila-text-primary)] sm:text-3xl">Спільна подорож</h1>
          </div>
          <Link to="/" className="rounded-xl border border-[var(--lila-border-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">Назад</Link>
        </div>

        <p className="mt-2 text-sm text-[var(--lila-text-muted)]">
          HOST ROOM ONLINE: ведучий керує ритмом групи, а кожен гравець кидає власний кубик.
        </p>

        <div className="mt-4">
          <TelegramRoomsPanel
            defaultFlow="host"
            initialRoomCode={initialRoomCode}
            initialRoomId={initialRoomId}
          />
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lila-text-muted)]">Минулі кімнати</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={!canPrev}
              className="rounded-lg border border-[var(--lila-border-soft)] px-2 py-1 text-xs text-[var(--lila-text-primary)] disabled:opacity-50"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => (canNext ? value + 1 : value))}
              disabled={!canNext}
              className="rounded-lg border border-[var(--lila-border-soft)] px-2 py-1 text-xs text-[var(--lila-text-primary)] disabled:opacity-50"
            >
              Далі
            </button>
          </div>
        </div>

        {!isTelegramMode ? (
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Для multiplayer відкрийте застосунок у Telegram Mini App.</p>
        ) : pagedRooms.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Ще немає збережених кімнат.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pagedRooms.map((snapshot) => (
              <li key={snapshot.room.id} className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--lila-text-primary)]">#{snapshot.room.code}</p>
                    <p className="text-xs text-[var(--lila-text-muted)]">{snapshot.room.status} · {snapshot.room.boardType}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/host-room/${snapshot.room.id}`)}
                    className="rounded-lg border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-1.5 text-xs text-[var(--lila-text-primary)]"
                  >
                    Відкрити
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-3 text-xs text-rose-700">{error}</p>}
      </section>
    </main>
  );
};
