import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CanvaWingAccent } from '../../components/CanvaWingAccent';
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
    <main className="lila-page-shell">
      <div className="lila-canva-frame min-h-0">
        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.08fr)_390px]">
          <section className="lila-poster-panel min-h-0 px-5 py-5 sm:px-6">
            <CanvaWingAccent className="pointer-events-none absolute -right-8 top-2 hidden h-36 w-56 text-[color:rgba(90,72,135,0.18)] md:block" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="lila-utility-label">Shared Journey</p>
                <h1 className="lila-poster-title mt-4 max-w-3xl">Спільна подорож для ведучого і гравців</h1>
                <p className="lila-poster-copy mt-4 max-w-2xl">
                  Desktop-подача ближча до Canva-макета: великий hero-блок, окрема poster-зона для multiplayer narrative і чиста
                  панель room-entry. На мобільному це все стискається без втрати читабельності.
                </p>
              </div>
              <Link to="/" className="lila-secondary-button px-4 py-2 text-sm font-medium">Назад</Link>
            </div>

            <div className="lila-editorial-divider mt-5" />

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Host-led</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Ведучий тримає контекст і ритм групи.</p>
              </div>
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Own Dice</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Кожен гравець зберігає свій власний кидок.</p>
              </div>
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Focused</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Ніякого зайвого шуму навколо основного сценарію входу.</p>
              </div>
            </div>

            <div className="mt-6 rounded-[30px] border border-[var(--lila-border-soft)] bg-[linear-gradient(180deg,rgba(236,229,248,0.78),rgba(255,255,255,0.5))] px-5 py-4 text-sm leading-6 text-[var(--lila-text-primary)]">
              HOST ROOM ONLINE: ведучий керує ритмом групи, а кожен гравець кидає власний кубик.
            </div>

            <div className="lila-scroll-pane mt-5 pr-1">
              <TelegramRoomsPanel
                defaultFlow="host"
                initialRoomCode={initialRoomCode}
                initialRoomId={initialRoomId}
              />
            </div>
          </section>

          <section className="lila-canva-sidebar min-h-0 px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="lila-utility-label">Recent Rooms</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--lila-text-primary)]">Минулі кімнати</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  disabled={!canPrev}
                  className="lila-secondary-button px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => setPage((value) => (canNext ? value + 1 : value))}
                  disabled={!canNext}
                  className="lila-secondary-button px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Далі
                </button>
              </div>
            </div>

            <div className="lila-editorial-divider mt-4" />

            <div className="lila-scroll-pane mt-4 pr-1">
              {!isTelegramMode ? (
                <p className="text-sm text-[var(--lila-text-muted)]">Для multiplayer відкрийте застосунок у Telegram Mini App.</p>
              ) : pagedRooms.length === 0 ? (
                <p className="text-sm text-[var(--lila-text-muted)]">Ще немає збережених кімнат.</p>
              ) : (
                <ul className="space-y-3">
                  {pagedRooms.map((snapshot) => (
                    <li key={snapshot.room.id} className="lila-paper-card px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--lila-text-primary)]">#{snapshot.room.code}</p>
                          <p className="mt-1 text-xs text-[var(--lila-text-muted)]">{snapshot.room.status} · {snapshot.room.boardType}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/host-room/${snapshot.room.id}`)}
                          className="lila-secondary-button px-3 py-2 text-xs font-medium"
                        >
                          Відкрити
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {error && <p className="mt-3 text-xs text-[var(--lila-danger-text)]">{error}</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
