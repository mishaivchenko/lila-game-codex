import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { CanvaPageTopBar } from '../../components/CanvaPageTopBar';
import type { GameSession } from '../../domain/types';
import { useGameContext } from '../../context/GameContext';
import { createRepositories } from '../../repositories';

const PAGE_SIZE = 6;
const repositories = createRepositories();

export const SinglePlayerStartPage = () => {
  const navigate = useNavigate();
  const { loadSession, resumeLastSession } = useGameContext();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = useState<GameSession | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [localSessions, lastActive] = await Promise.all([
        repositories.sessionsRepository.listSessions(120, 0),
        repositories.sessionsRepository.getLastActiveSession(),
      ]);
      setSessions(localSessions);
      setActiveSession(lastActive);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const pagedSessions = useMemo(
    () => sessions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [page, sessions],
  );

  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < sessions.length;

  return (
    <main className="lila-page-shell">
      <div className="lila-canva-frame min-h-0 flex-1">
        <CanvaPageTopBar backHref="/" />

        <div className="grid min-h-0 flex-1 gap-4 pt-5 min-[1460px]:grid-cols-[minmax(0,0.98fr)_360px]">
          <section className="relative flex min-h-0 flex-col items-center px-2 text-center sm:px-4">
            <BrandLogo
              alt="SoulVio Ліла"
              className="pointer-events-none absolute -left-14 top-24 hidden h-44 w-44 opacity-[var(--lila-brand-mark-opacity)] md:block"
            />
            <BrandLogo
              alt="SoulVio Ліла"
              className="pointer-events-none absolute -right-16 bottom-4 hidden h-52 w-52 opacity-[var(--lila-brand-mark-opacity)] lg:block"
            />

            <div className="w-full max-w-[720px]">
              <h1 className="lila-canva-stage-title mt-2">Твоя особиста подорож</h1>

              <div className="mt-7 space-y-4">
                <button
                  type="button"
                  onClick={() => navigate('/setup')}
                  className="lila-canva-action w-full px-5 py-5 text-center"
                >
                  <p className="text-[1.28rem] font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">
                    Почати нову гру
                  </p>
                  <p className="text-sm leading-6 text-[var(--lila-text-muted)]">
                    Кожен новий запит - це крок до своєї справжності.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void resumeLastSession().then(() => navigate('/game'));
                  }}
                  disabled={!activeSession}
                  className="lila-canva-action w-full px-5 py-5 text-center disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <p className="text-[1.28rem] font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">
                    Продовжити розмову із собою
                  </p>
                  <p className="text-sm leading-6 text-[var(--lila-text-muted)]">
                    {activeSession
                      ? `Зупинилися на важливому усвідомленні. Готова йти далі з клітини ${activeSession.currentCell}.`
                      : 'Коли зʼявиться активна сесія, вона відкриється тут одним тапом.'}
                  </p>
                </button>
              </div>

              <p className="mx-auto mt-5 max-w-[560px] text-sm leading-6 text-[var(--lila-text-muted)]">
                На desktop архів залишається поруч, а на mobile усе складається в той самий спокійний one-screen flow.
              </p>
            </div>
          </section>

          <section className="lila-canva-sidebar min-h-0 px-5 py-5 sm:px-6 min-[1460px]:overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="lila-utility-label">Активна гра</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-[var(--lila-text-primary)]">
                  Історія сесій
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

            <div className="lila-scroll-pane mt-4 max-h-[32vh] pr-1 min-[1460px]:max-h-none">
              {loading ? (
                <p className="text-sm text-[var(--lila-text-muted)]">Завантаження локальної історії...</p>
              ) : pagedSessions.length === 0 ? (
                <p className="text-sm text-[var(--lila-text-muted)]">Ще немає збережених сесій на цьому пристрої.</p>
              ) : (
                <ul className="space-y-3">
                  {pagedSessions.map((session) => {
                    const isFinished = session.finished || session.sessionStatus === 'completed';
                    return (
                      <li key={session.id} className="lila-list-card px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--lila-text-primary)]">
                            {session.boardType === 'full' ? 'Повна гра' : 'Коротка гра'} | клітинка {session.currentCell}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${isFinished ? 'bg-[var(--lila-success-bg)] text-[var(--lila-success-text)]' : 'bg-[var(--lila-warning-bg)] text-[var(--lila-warning-text)]'}`}
                          >
                            {isFinished ? 'Завершена' : 'У процесі'}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[var(--lila-text-muted)]">
                          {new Date(session.updatedAt).toLocaleString('uk-UA', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            void loadSession(session).then(() => navigate('/game'));
                          }}
                          className="lila-secondary-button mt-3 px-3 py-2 text-xs font-medium"
                        >
                          Відкрити
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
