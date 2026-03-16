import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { GameSession } from '../../domain/types';
import { CanvaWingAccent } from '../../components/CanvaWingAccent';
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
      <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
        <section className="lila-panel px-5 py-5 sm:px-6">
          <CanvaWingAccent className="pointer-events-none absolute -right-10 top-0 hidden h-32 w-48 text-[color:rgba(90,72,135,0.18)] md:block" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="lila-utility-label">Single Player</p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--lila-text-primary)] sm:text-4xl">Одиночна гра</h1>
              <p className="mt-3 max-w-md text-sm text-[var(--lila-text-muted)]">
                Спокійний локальний режим з персональними нотатками, історією сесій і швидким поверненням до гри.
              </p>
            </div>
            <Link to="/" className="lila-secondary-button px-4 py-2 text-sm font-medium">Назад</Link>
          </div>

          <div className="mt-6 grid gap-3">
            {activeSession && (
              <div className="lila-list-card px-4 py-4">
                <p className="lila-utility-label">Resume ready</p>
                <p className="mt-2 text-lg font-semibold text-[var(--lila-text-primary)]">
                  Поточна сесія: клітина {activeSession.currentCell}
                </p>
                <p className="mt-1 text-sm text-[var(--lila-text-muted)]">
                  Повернення займе один тап, без нового налаштування шляху.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                void resumeLastSession().then(() => navigate('/game'));
              }}
              disabled={!activeSession}
              className="lila-primary-button px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Продовжити гру
            </button>
            <button
              type="button"
              onClick={() => navigate('/setup')}
              className="lila-secondary-button px-4 py-3 text-sm font-medium"
            >
              Почати нову гру
            </button>
          </div>
        </section>

        <section className="lila-panel min-h-0 px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="lila-utility-label">Session Archive</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--lila-text-primary)]">Минулі ігри</h2>
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

          <div className="lila-scroll-pane mt-4 pr-1">
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
                          {session.boardType === 'full' ? 'Повна дошка' : 'Коротка дошка'} · Клітина {session.currentCell}
                        </p>
                        <span className={`rounded-full px-2.5 py-1 text-xs ${isFinished ? 'bg-[var(--lila-success-bg)] text-[var(--lila-success-text)]' : 'bg-[var(--lila-warning-bg)] text-[var(--lila-warning-text)]'}`}>
                          {isFinished ? 'Завершена' : 'У процесі'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--lila-text-muted)]">
                        Оновлено: {new Date(session.updatedAt).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
    </main>
  );
};
