import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CanvaBirdAccent } from '../../components/CanvaBirdAccent';
import { CanvaPageTopBar } from '../../components/CanvaPageTopBar';
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
      <div className="lila-canva-frame min-h-0 flex-1">
        <CanvaPageTopBar backHref="/" />

        <div className="grid min-h-0 flex-1 gap-4 pt-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="relative min-h-0 px-2 text-center sm:px-4">
            <CanvaBirdAccent className="pointer-events-none absolute -right-10 top-20 hidden h-44 w-52 text-[color:rgba(179,168,216,0.4)] lg:block" />

            <div className="mx-auto max-w-[760px]">
              <h1 className="lila-canva-stage-title mt-2">Твій кабінет провідника</h1>
              <p className="lila-canva-stage-copy mx-auto mt-4 max-w-[640px]">
                Це спільна подорож для ведучого і гравців: ти тут, щоб підсвітити іншим їхні тіні та допомогти зруйнувати ілюзії,
                не втрачаючи спокійного ритму гри.
              </p>

              <div className="mt-7 space-y-4">
                <div className="lila-canva-action px-5 py-5 text-center">
                  <p className="text-[1.22rem] font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">
                    Створити нову гру
                  </p>
                  <p className="text-sm leading-6 text-[var(--lila-text-muted)]">
                    Відкрий простір для нової групи. Згенеруй код доступу та запроси учасників.
                  </p>
                </div>

                <div className="lila-canva-stage-panel px-4 py-4 sm:px-5">
                  <div className="lila-scroll-pane max-h-[40vh] pr-1">
                    <TelegramRoomsPanel
                      defaultFlow="host"
                      initialRoomCode={initialRoomCode}
                      initialRoomId={initialRoomId}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="lila-canva-sidebar min-h-0 px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="lila-utility-label">Активні ігри</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">
                  Минулі кімнати
                </h2>
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
                    <li key={snapshot.room.id} className="lila-list-card px-4 py-4">
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
