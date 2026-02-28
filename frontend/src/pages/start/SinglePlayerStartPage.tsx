import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameContext } from '../../context/GameContext';
import { createRepositories } from '../../repositories';
import type { GameSession } from '../../domain/types';

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
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-gradient-to-b from-[var(--lila-bg-start)] to-[var(--lila-bg-end)] px-4 py-6 sm:px-6">
      <section className="rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-6 shadow-[0_18px_44px_rgba(42,36,31,0.14)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--lila-text-muted)]">Single Player</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--lila-text-primary)] sm:text-3xl">Одиночна гра</h1>
          </div>
          <Link to="/" className="rounded-xl border border-[var(--lila-border-soft)] px-3 py-2 text-sm text-[var(--lila-text-primary)]">Назад</Link>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {activeSession && (
            <button
              type="button"
              onClick={() => {
                void resumeLastSession().then(() => navigate('/game'));
              }}
              className="rounded-2xl bg-[var(--lila-accent)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--lila-accent-hover)]"
            >
              Продовжити гру
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/setup')}
            className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] px-4 py-3 text-sm font-medium text-[var(--lila-text-primary)] transition hover:bg-[var(--lila-surface-muted)]"
          >
            Почати нову гру
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)]/92 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lila-text-muted)]">Попередні ігри</h2>
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

        {loading ? (
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Завантаження локальної історії...</p>
        ) : pagedSessions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--lila-text-muted)]">Ще немає збережених сесій на цьому пристрої.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pagedSessions.map((session) => {
              const isFinished = session.finished || session.sessionStatus === 'completed';
              return (
                <li key={session.id} className="rounded-2xl border border-[var(--lila-border-soft)] bg-[var(--lila-surface)] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--lila-text-primary)]">
                      {session.boardType === 'full' ? 'Повна дошка' : 'Коротка дошка'} · Клітина {session.currentCell}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${isFinished ? 'bg-[var(--lila-success-bg)] text-[var(--lila-success-text)]' : 'bg-[var(--lila-warning-bg)] text-[var(--lila-warning-text)]'}`}>
                      {isFinished ? 'Завершена' : 'У процесі'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--lila-text-muted)]">
                    Оновлено: {new Date(session.updatedAt).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void loadSession(session).then(() => navigate('/game'));
                    }}
                    className="mt-2 rounded-lg border border-[var(--lila-border-soft)] bg-[var(--lila-surface-muted)] px-3 py-1.5 text-xs text-[var(--lila-text-primary)]"
                  >
                    Відкрити
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
};
