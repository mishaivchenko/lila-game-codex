import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { CanvaPageTopBar } from '../../components/CanvaPageTopBar';
import { CompactPanelModal } from '../../components/CompactPanelModal';
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
  const [showRoomsModal, setShowRoomsModal] = useState(false);

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

  const previousRoomsPanel = (
    <>
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

      <div className="lila-scroll-pane mt-4 min-h-0 pr-1">
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
    </>
  );

  return (
    <main className="lila-page-shell">
      <div className="lila-canva-frame min-h-0 flex-1">
        <CanvaPageTopBar backHref="/" />

        <div
          className="grid min-h-0 flex-1 gap-4 pt-4 grid-rows-[auto_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-rows-1"
          data-testid="multiplayer-start-layout"
        >
          <section className="relative min-h-0 px-2 sm:px-4">
            <BrandLogo
              alt="SoulVio Ліла"
              className="pointer-events-none absolute -right-16 top-12 hidden h-48 w-48 opacity-[var(--lila-brand-mark-opacity)] lg:block"
            />

            <div className="mx-auto flex h-full max-w-[720px] min-h-0 flex-col">
              <div className="text-center">
                <h1 className="lila-canva-stage-title mt-2">Онлайн гра</h1>
                <p className="lila-canva-stage-copy mx-auto mt-3 max-w-[560px]">
                  Виберіть роль і зайдіть у кімнату без зайвих кроків на екрані.
                </p>
              </div>

              <div className="mt-5 min-h-0 flex-1">
                <TelegramRoomsPanel
                  defaultFlow="host"
                  initialRoomCode={initialRoomCode}
                  initialRoomId={initialRoomId}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 xl:hidden">
                <button
                  type="button"
                  onClick={() => setShowRoomsModal(true)}
                  className="lila-secondary-button px-4 py-2.5 text-sm font-medium"
                >
                  Минулі кімнати
                </button>
              </div>
            </div>
          </section>

          <section className="hidden min-h-0 lila-canva-sidebar px-5 py-5 sm:px-6 xl:flex xl:flex-col">
            {previousRoomsPanel}
          </section>
        </div>
      </div>

      <div className="xl:hidden">
        <CompactPanelModal
          open={showRoomsModal}
          eyebrow="Активні ігри"
          title="Минулі кімнати"
          onClose={() => setShowRoomsModal(false)}
        >
          {previousRoomsPanel}
        </CompactPanelModal>
      </div>
    </main>
  );
};
