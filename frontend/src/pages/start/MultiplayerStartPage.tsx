import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegramAuth } from '../../features/telegram';
import { useTelegramRooms } from '../../features/telegram/rooms/TelegramRoomsContext';
import { buildRoomInviteUrl } from '../../features/telegram/telegramLinks';

const PAGE_SIZE = 5;

export const MultiplayerStartPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isTelegramMode, status, user, token } = useTelegramAuth();
  const {
    myRooms,
    error,
    isLoading,
    createRoom,
    joinRoomByCode,
    loadRoomById,
    refreshMyRooms,
  } = useTelegramRooms();
  const [page, setPage] = useState(0);
  const [code, setCode] = useState(() => searchParams.get('roomCode') ?? '');

  const canHost = Boolean(user?.canHostCurrentChat || user?.isSuperAdmin);

  useEffect(() => {
    if (!token) {
      return;
    }
    void refreshMyRooms();
  }, [refreshMyRooms, token]);

  useEffect(() => {
    const roomId = searchParams.get('roomId');
    const roomCode = searchParams.get('roomCode');
    if (!token) {
      return;
    }
    if (roomId) {
      void loadRoomById(roomId).then((snapshot) => {
        if (snapshot?.room.id) {
          navigate(`/host-room/${snapshot.room.id}`, { replace: true });
        }
      });
      return;
    }
    if (roomCode) {
      void joinRoomByCode(roomCode).then((snapshot) => {
        if (snapshot?.room.id) {
          navigate(`/host-room/${snapshot.room.id}`, { replace: true });
        }
      });
    }
  }, [joinRoomByCode, loadRoomById, navigate, searchParams, token]);

  const pagedRooms = useMemo(
    () => myRooms.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [myRooms, page],
  );
  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < myRooms.length;

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return;
    }
    void joinRoomByCode(normalized).then((snapshot) => {
      if (snapshot?.room.id) {
        navigate(`/host-room/${snapshot.room.id}`);
      }
    });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-6 shadow-[0_18px_44px_rgba(42,36,31,0.14)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--lila-text-muted)]">Multiplayer</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--lila-text-primary)] sm:text-3xl">Гра з іншими</h1>
          </div>
          <Link to="/" className="rounded-xl border border-[var(--lila-border-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">Назад</Link>
        </div>

        {!isTelegramMode && (
          <p className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50/90 px-3 py-2 text-sm text-amber-900">
            Multiplayer доступний у Telegram Mini App.
          </p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr,1fr]">
          <button
            type="button"
            onClick={() => {
              void createRoom('full').then((snapshot) => {
                if (snapshot?.room.id) {
                  navigate(`/host-room/${snapshot.room.id}`);
                }
              });
            }}
            disabled={!isTelegramMode || status !== 'authenticated' || !canHost || !token || isLoading}
            className="rounded-2xl bg-[var(--lila-accent)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--lila-accent-hover)] disabled:opacity-50"
          >
            Створити кімнату (Host)
          </button>

          <form onSubmit={handleJoin} className="flex items-center gap-2 rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-3 py-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Код кімнати"
              maxLength={8}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--lila-text-primary)] outline-none"
            />
            <button
              type="submit"
              disabled={!isTelegramMode || status !== 'authenticated' || !token || isLoading}
              className="rounded-lg border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-2 py-1 text-xs text-[var(--lila-text-primary)] disabled:opacity-50"
            >
              Join
            </button>
          </form>
        </div>

        {!canHost && isTelegramMode && (
          <p className="mt-2 text-xs text-[var(--lila-text-muted)]">
            Режим ведучого заблокований для цього акаунта. Ви можете приєднуватися як гравець.
          </p>
        )}

        <p className="mt-3 text-xs text-[var(--lila-text-muted)]">
          Скоро тут буде швидкий інвайт через бота: {buildRoomInviteUrl('CODE')}
        </p>
      </section>

      <section className="mt-4 rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lila-text-muted)]">Історія кімнат</h2>
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

        {!token ? (
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Потрібна Telegram-авторизація для історії кімнат.</p>
        ) : pagedRooms.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Ще немає кімнат. Створіть першу або приєднайтеся за кодом.</p>
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
