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
      <div className="lila-canva-frame min-h-0">
        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.06fr)_380px]">
          <section className="lila-poster-panel flex min-h-0 flex-col px-5 py-5 sm:px-6">
            <CanvaWingAccent className="pointer-events-none absolute -right-6 top-2 hidden h-36 w-56 text-[color:rgba(90,72,135,0.18)] md:block" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="lila-utility-label">Single Player</p>
                <h1 className="lila-poster-title mt-4 max-w-3xl">Одиночна гра для особистого ритму</h1>
                <p className="lila-poster-copy mt-4 max-w-2xl">
                  Спокійний локальний режим із poster-like композицією: великий геройський вступ, чіткі primary actions і архів
                  сесій збоку, без зайвої тісноти на desktop.
                </p>
              </div>
              <Link to="/" className="lila-secondary-button px-4 py-2 text-sm font-medium">Назад</Link>
            </div>

            <div className="lila-editorial-divider mt-5" />

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Mobile-safe</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Основні CTA зверху і доступні з першого екрана.</p>
              </div>
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Resume</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Повернення до поточної сесії залишається одним тапом.</p>
              </div>
              <div className="lila-paper-card px-4 py-4">
                <p className="lila-utility-label">Archive</p>
                <p className="mt-2 text-sm leading-6 text-[var(--lila-text-primary)]">Минулі ігри живуть поруч, але не душать стартовий сценарій.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="lila-canva-actions">
                {activeSession && (
                  <div className="lila-canva-action">
                    <p className="lila-utility-label">Resume Ready</p>
                    <p className="text-2xl font-black tracking-[-0.05em] text-[var(--lila-text-primary)]">
                      Поточна сесія: клітина {activeSession.currentCell}
                    </p>
                    <p className="text-sm leading-6 text-[var(--lila-text-muted)]">
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
                  className="lila-primary-button px-4 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Продовжити гру
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/setup')}
                  className="lila-secondary-button px-4 py-4 text-sm font-medium"
                >
                  Почати нову гру
                </button>
              </div>

              <div className="lila-canva-sidebar flex flex-col justify-between p-4">
                <div>
                  <p className="lila-utility-label">Design Note</p>
                  <p className="mt-3 text-lg font-semibold text-[var(--lila-text-primary)]">Desktop без втрати mobile-first feel</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--lila-text-muted)]">
                    На великих екранах макет дихає шириною, а на мобільному все просто стекається в зрозумілий один-column flow.
                  </p>
                </div>
                <div className="lila-paper-card mt-4 px-4 py-4 text-sm leading-6 text-[var(--lila-text-muted)]">
                  Тут немає page-level scroll у сценарії старту: довгі списки живуть в окремій панелі архіву.
                </div>
              </div>
            </div>
          </section>

          <section className="lila-canva-sidebar min-h-0 px-5 py-5 sm:px-6">
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

            <div className="lila-editorial-divider mt-4" />

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
                      <li key={session.id} className="lila-paper-card px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--lila-text-primary)]">
                            {session.boardType === 'full' ? 'Повна дошка' : 'Коротка дошка'} · Клітина {session.currentCell}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${isFinished ? 'bg-[var(--lila-success-bg)] text-[var(--lila-success-text)]' : 'bg-[var(--lila-warning-bg)] text-[var(--lila-warning-text)]'}`}
                          >
                            {isFinished ? 'Завершена' : 'У процесі'}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[var(--lila-text-muted)]">
                          Оновлено:
                          {' '}
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
